import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { VisitSlot } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import { getFlashFormValues, getSelectedSlot, getSlotByTimeAndRestriction } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'
import { VisitService, VisitSessionsService } from '../../services'

export default class DateAndTime {
  constructor(
    private readonly mode: string,
    private readonly visitService: VisitService,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { prisonId } = req.session.selectedEstablishment
    const { visitSessionData } = req.session

    const warningMessages: { id: string; message: string }[] = []

    let daysUntilVisitStart =
      isUpdate && req.session.visitSessionData?.overrideBookingWindow === true
        ? 0
        : req.session.selectedEstablishment.policyNoticeDaysMin

    if (visitSessionData.daysUntilBanExpiry) {
      if (visitSessionData.daysUntilBanExpiry > daysUntilVisitStart) {
        daysUntilVisitStart = visitSessionData.daysUntilBanExpiry
        warningMessages.push({
          id: 'banned-visitor-reason',
          message: 'A selected visitor is banned. Time slots during the period of the ban are not shown.',
        })
      }
    }

    const { slotsList, whereaboutsAvailable } = await this.visitSessionsService.getVisitSessions({
      username: res.locals.user.username,
      offenderNo: visitSessionData.prisoner.offenderNo,
      visitRestriction: visitSessionData.visitRestriction,
      prisonId,
      minNumberOfDays: daysUntilVisitStart.toString(),
    })

    let matchingSlot
    let showSlotChangeMessage = false

    // first time here on update journey, visitSlot.id will be ''
    if (isUpdate && visitSessionData.visitSlot?.id === '') {
      matchingSlot = getSlotByTimeAndRestriction(
        slotsList,
        visitSessionData.visitSlot.startTimestamp,
        visitSessionData.visitSlot.endTimestamp,
        visitSessionData.visitRestriction,
      )

      if (
        matchingSlot &&
        (matchingSlot.availableTables > 0 ||
          visitSessionData.visitRestriction === visitSessionData.originalVisitSlot.visitRestriction)
      ) {
        visitSessionData.visitSlot.id = matchingSlot.id
      }

      // if no matching slot, set showSlotChangeMessage = true
      showSlotChangeMessage = !matchingSlot

      if (visitSessionData.visitRestriction !== visitSessionData.originalVisitSlot.visitRestriction) {
        let messageFullString = 'The visit type has changed from '
        messageFullString += visitSessionData.visitRestriction === 'OPEN' ? 'closed to open.' : 'open to closed.'

        warningMessages.push({
          id: 'restriction-change-reason',
          message: messageFullString,
        })
      }
    }

    let originalVisitSlot
    if (isUpdate && visitSessionData.originalVisitSlot) {
      // matching on original time but session's current visit restriction to ensure
      // originally selected time slot is available for re-selection even if restriction changes
      originalVisitSlot = getSlotByTimeAndRestriction(
        slotsList,
        visitSessionData.originalVisitSlot.startTimestamp,
        visitSessionData.originalVisitSlot.endTimestamp,
        visitSessionData.visitRestriction,
      )
    }

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.visitSlot?.id) {
      formValues['visit-date-and-time'] = visitSessionData.visitSlot?.id
    }

    const slotsPresent = Object.values(slotsList).some(value => value.length)

    req.session.slotsList = slotsList

    visitSessionData.allowOverBooking = false // intentionally reset when returning to date and time page

    res.render('pages/bookAVisit/dateAndTime', {
      errors: req.flash('errors'),
      visitRestriction: visitSessionData.visitRestriction,
      prisonerName: visitSessionData.prisoner.name,
      offenderNo: visitSessionData.prisoner.offenderNo,
      location: visitSessionData.prisoner.location,
      whereaboutsAvailable,
      slotsList,
      formValues,
      slotsPresent,
      showSlotChangeMessage,
      warningMessages,
      originalVisitSlot,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(`${urlPrefix}/select-date-and-time`)
    }

    visitSessionData.visitSlot = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

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

    return res.redirect(`${urlPrefix}/additional-support`)
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
