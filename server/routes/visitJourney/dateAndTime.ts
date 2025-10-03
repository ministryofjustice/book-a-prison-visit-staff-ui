import type { Request, Response } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { BookOrUpdate, MoJAlert, VisitSessionData } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitService, VisitSessionsService } from '../../services'
import { CalendarVisitSession } from '../../services/visitSessionsService'

export default class DateAndTime {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { prisonId, policyNoticeDaysMax } = req.session.selectedEstablishment
    const { visitSessionData } = req.session

    const messages: MoJAlert[] = req.flash('messages')

    // calculate min booking window and any override or bans in place
    const policyNoticeDaysMin = visitSessionData.overrideBookingWindow
      ? 0
      : req.session.selectedEstablishment.policyNoticeDaysMin + 1 // ensure 'full' min days

    const isBanActive = visitSessionData.daysUntilBanExpiry > policyNoticeDaysMin
    const minNumberOfDays = isBanActive ? visitSessionData.daysUntilBanExpiry : policyNoticeDaysMin

    const { calendar, scheduledEventsAvailable } = await this.visitSessionsService.getVisitSessionsAndScheduleCalendar({
      username: res.locals.user.username,
      prisonId,
      prisonerId: visitSessionData.prisoner.offenderNo,
      minNumberOfDays,
      visitRestriction: visitSessionData.visitRestriction,
      selectedVisitSession: visitSessionData.selectedVisitSession,
      originalVisitSession: visitSessionData.originalVisitSession,
    })

    const isAtLeastOneVisitSession = calendar.some(day => day.visitSessions.length > 0)
    if (!isAtLeastOneVisitSession) {
      return res.render('pages/bookAVisit/dateAndTimeNoVisitSessions', {
        messages,
        prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
        prisonerLocation: visitSessionData.prisoner.location,
        visitRestriction: visitSessionData.visitRestriction,
      })
    }

    // store visit sessions for use in validation
    const allVisitSessions: CalendarVisitSession[] = calendar.reduce((acc, cur) => acc.concat(cur.visitSessions), [])
    visitSessionData.allVisitSessions = allVisitSessions

    // TODO move setting messages elsewhere?
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
      const isOriginalSessionAvailable = this.isVisitSessionAvailable(
        visitSessionData.originalVisitSession,
        allVisitSessions,
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
          text: 'Select a new visit time.',
        })
      }
    }

    const formValues = {
      // TODO simplify
      visitSessionId: this.isVisitSessionAvailable(visitSessionData.selectedVisitSession, allVisitSessions)
        ? `${visitSessionData.selectedVisitSession.date}_${visitSessionData.selectedVisitSession.sessionTemplateReference}`
        : '',
    }

    // TODO refactor alongside formValues above
    // if update journey, default selectedVisitSession to originalVisitSession (if it's still present)
    // is 'isUpdate' check needed?
    if (!formValues.visitSessionId && visitSessionData.originalVisitSession) {
      // don't need to actually check it exists?
      formValues.visitSessionId = `${visitSessionData.originalVisitSession.date}_${visitSessionData.originalVisitSession.sessionTemplateReference}`
    }

    visitSessionData.allowOverBooking = false // intentionally reset when returning to date and time page

    return res.render('pages/bookAVisit/dateAndTime', {
      urlPrefix: getUrlPrefix(isUpdate),
      errors: req.flash('errors'),
      formValues,
      messages,
      prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
      prisonerLocation: visitSessionData.prisoner.location,
      visitRestriction: visitSessionData.visitRestriction,
      policyNoticeDaysMax,
      calendar,
      originalVisitSession: visitSessionData.originalVisitSession,
      scheduledEventsAvailable,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate)

    if (!errors.isEmpty()) {
      // TODO fix errors data for correct error summary link - see https://github.com/ministryofjustice/hmpps-book-a-prison-visit-ui/blob/d04a98c94467ff048f8c1d0686bf1fc961e250ab/server/routes/bookVisit/chooseVisitTimeController.ts#L85-L96
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/select-date-and-time`)
    }

    const { visitSessionId } = matchedData<{ visitSessionId: string }>(req)
    const selectedVisitSession = this.getSelectedVisitSession(visitSessionData.allVisitSessions, visitSessionId)
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
      await this.visitService.changeVisitApplication({
        username: res.locals.user.username,
        visitSessionData,
      })
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
        return !!this.getSelectedVisitSession(req.session.visitSessionData.allVisitSessions, visitSessionId)
      })
      .withMessage('No visit time selected')
  }

  private getSelectedVisitSession(
    allVisitSessions: CalendarVisitSession[],
    visitSessionId: string,
  ): CalendarVisitSession | undefined {
    const [date, sessionTemplateReference] = visitSessionId.split('_')
    return allVisitSessions?.find(
      visitSession => visitSession.date === date && visitSession.sessionTemplateReference === sessionTemplateReference,
    )
  }

  private isVisitSessionAvailable(
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
        originalVisitSession.date === selectedVisitSession.date && originalVisitSession.sessionTemplateReference

      if (isOriginalSession) {
        return false
      }
    }

    return true
  }
}
