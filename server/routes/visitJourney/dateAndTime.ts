import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { VisitSlot } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import VisitSessionsService from '../../services/visitSessionsService'
import { getFlashFormValues, getSelectedSlot, getSlotByStartTimeAndRestriction } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class DateAndTime {
  constructor(
    private readonly mode: string,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { prisonId } = req.session.selectedEstablishment
    const { visitSessionData } = req.session
    const slotsList = await this.visitSessionsService.getVisitSessions({
      username: res.locals.user?.username,
      offenderNo: visitSessionData.prisoner.offenderNo,
      visitRestriction: visitSessionData.visitRestriction,
      prisonId,
    })

    let restrictionChangeMessage = ''
    let matchingSlot

    // first time here on update journey, visitSlot.id will be ''
    if (isUpdate && visitSessionData.visitSlot?.id === '') {
      matchingSlot = getSlotByStartTimeAndRestriction(
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

      if (visitSessionData.visitRestriction !== visitSessionData.originalVisitSlot.visitRestriction) {
        if (matchingSlot && matchingSlot.availableTables > 0) {
          restrictionChangeMessage = visitSessionData.closedVisitReason
            ? `This is now a closed visit due to a ${visitSessionData.closedVisitReason} restriction. `
            : 'This is now an open visit. '
          restrictionChangeMessage += 'The visit time can stay the same.'
        } else {
          restrictionChangeMessage = 'A new visit time must be selected as this is now '
          restrictionChangeMessage += visitSessionData.closedVisitReason
            ? `a closed visit due to a ${visitSessionData.closedVisitReason} restriction.`
            : 'an open visit.'
        }
      }
    }

    let originalVisitSlot
    if (isUpdate && visitSessionData.originalVisitSlot) {
      // matching on original time but session's current visit restriction to ensure
      // originally selected time slot is available for re-selection even if restriction changes
      originalVisitSlot = getSlotByStartTimeAndRestriction(
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

    res.render('pages/bookAVisit/dateAndTime', {
      accordionId: uuidv4(),
      errors: req.flash('errors'),
      visitRestriction: visitSessionData.visitRestriction,
      prisonerName: visitSessionData.prisoner.name,
      location: visitSessionData.prisoner.location,
      closedVisitReason: visitSessionData.closedVisitReason,
      slotsList,
      formValues,
      slotsPresent,
      restrictionChangeMessage,
      originalVisitSlot,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(req.originalUrl)
    }

    visitSessionData.visitSlot = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

    // See README ('Visit journeys – book and update') for explanation of this flow
    if (visitSessionData.applicationReference) {
      await this.visitSessionsService.changeReservedVisit({
        username: res.locals.user?.username,
        visitSessionData,
      })
    } else if (isUpdate) {
      const { applicationReference, visitStatus } = await this.visitSessionsService.changeBookedVisit({
        username: res.locals.user?.username,
        visitSessionData,
      })

      visitSessionData.applicationReference = applicationReference
      visitSessionData.visitStatus = visitStatus
    } else {
      const { applicationReference, reference, visitStatus } = await this.visitSessionsService.reserveVisit({
        username: res.locals.user?.username,
        visitSessionData,
      })

      visitSessionData.applicationReference = applicationReference
      visitSessionData.visitReference = reference
      visitSessionData.visitStatus = visitStatus
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
      username: res.locals.user?.username,
      operationId: res.locals.appInsightsOperationId,
    })

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)
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
