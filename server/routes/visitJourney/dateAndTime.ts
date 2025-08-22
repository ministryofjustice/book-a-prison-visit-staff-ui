import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { BookOrUpdate, MoJAlert, VisitSlot } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import { getFlashFormValues, getSelectedSlot, getMatchingSlot } from '../visitorUtils'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitService, VisitSessionsService } from '../../services'
import { isSameVisitSlot } from '../../utils/utils'

export default class DateAndTime {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { prisonId } = req.session.selectedEstablishment
    const { visitSessionData } = req.session

    const messages: MoJAlert[] = req.flash('messages')

    // calculate min booking window and any override or bans in place
    const policyNoticeDaysMin = visitSessionData.overrideBookingWindow
      ? 0
      : req.session.selectedEstablishment.policyNoticeDaysMin + 1 // ensure 'full' min days

    const isBanActive = visitSessionData.daysUntilBanExpiry > policyNoticeDaysMin
    const minNumberOfDays = isBanActive ? visitSessionData.daysUntilBanExpiry : policyNoticeDaysMin

    if (isBanActive) {
      messages.push({
        variant: 'information',
        title: 'A selected visitor is banned',
        showTitleAsHeading: true,
        text: 'Visit times during the period of the ban are not shown.',
      })
    }

    const { slotsList, whereaboutsAvailable } = await this.visitSessionsService.getVisitSessions({
      username: res.locals.user.username,
      offenderNo: visitSessionData.prisoner.offenderNo,
      visitRestriction: visitSessionData.visitRestriction,
      prisonId,
      minNumberOfDays,
    })

    // first time here on update journey, visitSlot.id will be ''
    if (isUpdate && visitSessionData.visitSlot?.id === '') {
      const matchingSlot = getMatchingSlot(
        slotsList,
        visitSessionData.visitSlot.startTimestamp,
        visitSessionData.visitSlot.endTimestamp,
        visitSessionData.visitRestriction,
        visitSessionData.visitSlot.sessionTemplateReference,
      )

      if (
        matchingSlot &&
        (matchingSlot.availableTables > 0 ||
          visitSessionData.visitRestriction === visitSessionData.originalVisitSlot.visitRestriction)
      ) {
        visitSessionData.visitSlot.id = matchingSlot.id
      }

      if (!matchingSlot) {
        messages.push({
          variant: 'error',
          title: 'The prisoner’s information has changed',
          showTitleAsHeading: true,
          text: 'Select a new visit time.',
        })
      }

      if (visitSessionData.visitRestriction !== visitSessionData.originalVisitSlot.visitRestriction) {
        const restrictionChange = visitSessionData.visitRestriction === 'OPEN' ? 'closed to open.' : 'open to closed.'

        messages.push({
          variant: 'error',
          title: `The visit type has changed from ${restrictionChange}`,
          showTitleAsHeading: true,
          text: 'Select a new visit time.',
        })
      }
    }

    // matching on original time but session's current visit restriction to ensure
    // originally selected time slot is available for re-selection even if restriction changes
    const originalVisitSlot = visitSessionData.originalVisitSlot
      ? getMatchingSlot(
          slotsList,
          visitSessionData.originalVisitSlot.startTimestamp,
          visitSessionData.originalVisitSlot.endTimestamp,
          visitSessionData.visitRestriction,
          visitSessionData.originalVisitSlot.sessionTemplateReference,
        )
      : undefined

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.visitSlot?.id) {
      formValues['visit-date-and-time'] = visitSessionData.visitSlot?.id
    }

    const slotsPresent = Object.values(slotsList).some(value => value.length)

    req.session.slotsList = slotsList

    visitSessionData.allowOverBooking = false // intentionally reset when returning to date and time page

    res.render('pages/bookAVisit/dateAndTime', {
      errors: req.flash('errors'),
      messages,
      visitRestriction: visitSessionData.visitRestriction,
      prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
      offenderNo: visitSessionData.prisoner.offenderNo,
      location: visitSessionData.prisoner.location,
      whereaboutsAvailable,
      slotsList,
      formValues,
      slotsPresent,
      originalVisitSlot,
      urlPrefix: getUrlPrefix(isUpdate),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(`${urlPrefix}/select-date-and-time`)
    }

    visitSessionData.visitSlot = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

    const isOriginalSlot = isUpdate
      ? isSameVisitSlot(visitSessionData.visitSlot, visitSessionData.originalVisitSlot)
      : false

    // If 'available tables is less than or equal to zero
    if (visitSessionData.visitSlot.availableTables <= 0) {
      // If on update journey, and not the original slot OR is not update journey
      if ((isUpdate && !isOriginalSlot) || !isUpdate) {
        // show overbooking page
        return res.redirect(`${urlPrefix}/select-date-and-time/overbooking`)
      }
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
      delete visitSessionData.visitSlot
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

    await this.auditService.reservedVisit({
      applicationReference: visitSessionData.applicationReference,
      visitReference: visitSessionData.visitReference,
      prisonerId: visitSessionData.prisoner.offenderNo,
      prisonId: visitSessionData.visitSlot.prisonId,
      visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
      startTimestamp: visitSessionData.visitSlot.startTimestamp,
      endTimestamp: visitSessionData.visitSlot.endTimestamp,
      visitRestriction: visitSessionData.visitRestriction,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })
  }

  validate(): ValidationChain {
    return body('visit-date-and-time').custom((value: string, { req }) => {
      // check selected slot is in the list that was shown
      const selectedSlot: VisitSlot = getSelectedSlot(req.session.slotsList, value)

      if (selectedSlot === undefined) {
        throw new Error('No time slot selected')
      }

      return true
    })
  }
}
