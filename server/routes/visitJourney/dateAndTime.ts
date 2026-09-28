import type { Request, Response } from 'express'
import { body, matchedData, Meta, ValidationChain, ValidationError, validationResult } from 'express-validator'
import { BookOrUpdate, FlashFormValues, MoJAlert, VisitSessionData } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitService, VisitSessionsService } from '../../services'
import { CalendarDay, CalendarVisitSession } from '../../services/visitSessionsService'

export type DateAndTimePageData = {
  urlPrefix: string
  errors: ValidationError[]
  formValues: FlashFormValues
  messages: MoJAlert[]
  prisonerName: string
  prisonerLocation: string
  visitRestriction: VisitSessionData['visitRestriction']
  policyNoticeDaysMax: number
  calendar: CalendarDay[]
  originalVisitSession: VisitSessionData['originalVisitSession']
  firstVisitSessionRadioInputId: string
  scheduledEventsAvailable: boolean
}

export type DateAndTimeNoVisitSessionsPageData = Pick<
  DateAndTimePageData,
  'urlPrefix' | 'messages' | 'prisonerName' | 'prisonerLocation' | 'visitRestriction'
>

export default class DateAndTime {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { prisonId, policyNoticeDaysMin, policyNoticeDaysMax } = req.session.selectedEstablishment
    const { visitSessionData } = req.session

    const errors = req.flash('errors')
    const messages: MoJAlert[] = req.flash('messages')

    // Calculate min booking window and any override or bans in place
    const adjustedPolicyNoticeDaysMin = visitSessionData.overrideBookingWindow ? 0 : policyNoticeDaysMin + 1 // + 1 to ensure 'full' min days
    const isBanActive = visitSessionData.daysUntilBanExpiry > adjustedPolicyNoticeDaysMin
    const minNumberOfDays = isBanActive ? visitSessionData.daysUntilBanExpiry : adjustedPolicyNoticeDaysMin

    const { calendar, scheduledEventsAvailable } = await this.visitSessionsService.getVisitSessionsAndScheduleCalendar({
      username: res.locals.user.username,
      prisonId,
      prisonerId: visitSessionData.prisoner.offenderNo,
      minNumberOfDays,
      visitors: visitSessionData.visitors,
      visitRestriction: visitSessionData.visitRestriction,
      selectedVisitSession: visitSessionData.selectedVisitSession,
      originalVisitSession: visitSessionData.originalVisitSession,
    })

    const isAtLeastOneVisitSession = calendar.some(day => day.visitSessions.length > 0)
    if (!isAtLeastOneVisitSession) {
      const data: DateAndTimeNoVisitSessionsPageData = {
        urlPrefix: getUrlPrefix(isUpdate),
        messages,
        prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
        prisonerLocation: visitSessionData.prisoner.location,
        visitRestriction: visitSessionData.visitRestriction,
      }

      return res.render('pages/bookAVisit/dateAndTimeNoVisitSessions', data)
    }

    // Store visit sessions for use in validation
    const allVisitSessions: CalendarVisitSession[] = calendar.reduce((acc, cur) => acc.concat(cur.visitSessions), [])
    visitSessionData.allVisitSessions = allVisitSessions

    // Add any additional messages
    messages.push(...this.getAdditionalMessages(isUpdate, isBanActive, visitSessionData))

    // Populate formValues if returning to the page or update journey
    const visitSessionId = this.getSelectedVisitSessionId(visitSessionData)
    const formValues = visitSessionId ? { visitSessionId } : {}

    // Intentionally reset when returning to date and time page
    visitSessionData.allowOverBooking = false

    const data: DateAndTimePageData = {
      urlPrefix: getUrlPrefix(isUpdate),
      errors,
      formValues,
      messages,
      prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
      prisonerLocation: visitSessionData.prisoner.location,
      visitRestriction: visitSessionData.visitRestriction,
      policyNoticeDaysMax,
      calendar,
      originalVisitSession: visitSessionData.originalVisitSession,
      firstVisitSessionRadioInputId: this.getFirstVisitSessionRadioInputId(visitSessionData.allVisitSessions),
      scheduledEventsAvailable,
    }

    return res.render('pages/bookAVisit/dateAndTime', data)
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate)

    if (!errors.isEmpty()) {
      const errorsArray = errors.array()
      if (errorsArray[0].type === 'field') {
        // update the path in error obj to match ID of first radio input so ErrorSummary link works correctly
        const firstVisitSessionRadioInputId = this.getFirstVisitSessionRadioInputId(visitSessionData.allVisitSessions)
        errorsArray[0].path = firstVisitSessionRadioInputId
      }
      req.flash('errors', errorsArray)
      return res.redirect(`${urlPrefix}/select-date-and-time`)
    }

    const { visitSessionId } = matchedData<{ visitSessionId: string }>(req)
    const selectedVisitSession = this.getVisitSessionById(visitSessionData.allVisitSessions, visitSessionId)
    visitSessionData.selectedVisitSession = {
      date: selectedVisitSession.date,
      sessionTemplateReference: selectedVisitSession.sessionTemplateReference,
      startTime: selectedVisitSession.startTime,
      endTime: selectedVisitSession.endTime,
      availableTables: selectedVisitSession.availableTables,
      capacity: selectedVisitSession.capacity,
    }

    if (this.isAnOverbooking(isUpdate, selectedVisitSession, visitSessionData.originalVisitSession)) {
      return res.redirect(`${urlPrefix}/select-date-and-time/overbooking`)
    }

    await this.reserveOrChangeApplication(req, res)

    return res.redirect(`${urlPrefix}/additional-support`)
  }

  async postOverbookings(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const urlPrefix = getUrlPrefix(isUpdate)
    const errors = validationResult(req)

    const { confirmOverBooking } = req.body // this will be set if we have come from overbooking confirmation page
    if (confirmOverBooking === 'no') {
      delete visitSessionData.selectedVisitSession
      return res.redirect(`${urlPrefix}/select-date-and-time`) // i.e. return early if we're going to
    }
    if (confirmOverBooking === 'yes') {
      visitSessionData.allowOverBooking = true
    }

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/select-date-and-time/overbooking`)
    }

    await this.reserveOrChangeApplication(req, res)

    return res.redirect(`${urlPrefix}/additional-support`)
  }

  private async reserveOrChangeApplication(req: Request, res: Response): Promise<void> {
    const { visitSessionData } = req.session
    const { prisonId } = req.session.selectedEstablishment
    const isUpdate = this.mode === 'update'

    // See README ('Visit journeys – book and update') for explanation of this flow
    if (visitSessionData.applicationReference) {
      await this.visitService.changeVisitApplication({ visitSessionData })
    } else if (isUpdate) {
      const { reference } = await this.visitService.createVisitApplicationFromVisit({
        username: res.locals.user.username,
        visitSessionData,
      })

      visitSessionData.applicationReference = reference
    } else {
      const { reference } = await this.visitService.createVisitApplication({
        username: res.locals.user.username,
        visitSessionData,
      })

      visitSessionData.applicationReference = reference
    }

    const { date, startTime, endTime } = visitSessionData.selectedVisitSession
    await this.auditService.reservedVisit({
      applicationReference: visitSessionData.applicationReference,
      visitReference: visitSessionData.visitReference,
      prisonerId: visitSessionData.prisoner.offenderNo,
      prisonId,
      visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
      startTimestamp: `${date}T${startTime}:00`,
      endTimestamp: `${date}T${endTime}:00`,
      visitRestriction: visitSessionData.visitRestriction,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })
  }

  validate(): ValidationChain {
    return body('visitSessionId')
      .custom((visitSessionId: string, { req }: Meta & { req: Express.Request }) => {
        return !!this.getVisitSessionById(req.session.visitSessionData.allVisitSessions, visitSessionId)
      })
      .withMessage('No visit time selected')
  }

  private buildVisitSessionId(date: string, sessionTemplateReference: string): string {
    return `${date}_${sessionTemplateReference}`
  }

  private getVisitSessionById(
    allVisitSessions: CalendarVisitSession[],
    visitSessionId: string,
  ): CalendarVisitSession | undefined {
    const [date, sessionTemplateReference] = visitSessionId.split('_')
    return allVisitSessions?.find(
      visitSession => visitSession.date === date && visitSession.sessionTemplateReference === sessionTemplateReference,
    )
  }

  private isVisitSessionInAllSessions(
    visitSession: VisitSessionData['selectedVisitSession'] | VisitSessionData['originalVisitSession'],
    allVisitSessions: CalendarVisitSession[],
  ): boolean {
    if (!visitSession) {
      return false
    }

    return allVisitSessions.some(
      session =>
        session.date === visitSession.date &&
        session.sessionTemplateReference === visitSession.sessionTemplateReference,
    )
  }

  private getSelectedVisitSessionId({
    allVisitSessions,
    selectedVisitSession,
    originalVisitSession,
  }: VisitSessionData): string | undefined {
    // Currently selected visit session (if available) if one is selected)
    // Could be new booking or an update journey with a new selected visit session
    const selectedVisitSessionId = this.isVisitSessionInAllSessions(selectedVisitSession, allVisitSessions)
      ? this.buildVisitSessionId(selectedVisitSession.date, selectedVisitSession.sessionTemplateReference)
      : undefined

    // Original visit session (if available) during an update journey
    const originalVisitSessionId = this.isVisitSessionInAllSessions(originalVisitSession, allVisitSessions)
      ? this.buildVisitSessionId(originalVisitSession.date, originalVisitSession.sessionTemplateReference)
      : undefined

    // Prefer the selected visit session ID if available, otherwise fall back to the original visit session ID
    const visitSessionId = selectedVisitSessionId ?? originalVisitSessionId

    // A disabled visit session (e.g. because of an age restriction) cannot be selected
    const isVisitSessionIdAvailableAndNotDisabled =
      visitSessionId && !this.getVisitSessionById(allVisitSessions, visitSessionId)?.disabled

    return isVisitSessionIdAvailableAndNotDisabled ? visitSessionId : undefined
  }

  private isAnOverbooking(
    isUpdate: boolean,
    selectedVisitSession: VisitSessionData['selectedVisitSession'],
    originalVisitSession: VisitSessionData['originalVisitSession'],
  ): boolean {
    const isOverbooked = selectedVisitSession.availableTables <= 0

    if (!isOverbooked) {
      return false
    }

    // if updating an existing booking, don't treat as an overbooking
    if (isUpdate) {
      const isOriginalSession =
        originalVisitSession.date === selectedVisitSession.date &&
        originalVisitSession.sessionTemplateReference === selectedVisitSession.sessionTemplateReference

      if (isOriginalSession) {
        return false
      }
    }

    return true
  }

  // Return radio input ID for first visit session in form e.g. "date-2025-09-01-morning"
  private getFirstVisitSessionRadioInputId(allVisitSessions: CalendarVisitSession[]): string {
    return `date-${allVisitSessions?.[0]?.date}-${allVisitSessions?.[0]?.daySection}`
  }

  // Work out any addition messages relating to bans, restriction change, etc
  private getAdditionalMessages(
    isUpdate: boolean,
    isBanActive: boolean,
    visitSessionData: VisitSessionData,
  ): MoJAlert[] {
    const messages: MoJAlert[] = []

    if (isBanActive) {
      messages.push({
        variant: 'information',
        title: 'A selected visitor is banned',
        showTitleAsHeading: true,
        text: 'Visit times during the period of the ban are not shown.',
      })
    }

    // Messages to add if updating and no session selected yet
    if (isUpdate && !visitSessionData.selectedVisitSession) {
      const isOriginalSessionAvailable = this.isVisitSessionInAllSessions(
        visitSessionData.originalVisitSession,
        visitSessionData.allVisitSessions,
      )

      if (!isOriginalSessionAvailable) {
        messages.push({
          variant: 'error',
          title: 'The prisoner’s information has changed',
          showTitleAsHeading: true,
          text: 'Select a new visit time.',
        })
      }

      const visitRestrictionHasChanged =
        visitSessionData.visitRestriction !== visitSessionData.originalVisitSession.visitRestriction
      if (visitRestrictionHasChanged) {
        const restrictionChange = visitSessionData.visitRestriction === 'OPEN' ? 'closed to open.' : 'open to closed.'

        messages.push({
          variant: 'error',
          title: `The visit type has changed from ${restrictionChange}`,
          showTitleAsHeading: true,
          text: 'You may need to select a new visit time.',
        })
      }
    }

    return messages
  }
}
