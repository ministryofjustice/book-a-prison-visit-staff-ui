import type { Request, Response } from 'express'
import { body, query, ValidationChain, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { VisitSlot } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import VisitSessionsService from '../../services/visitSessionsService'
import { getFlashFormValues, getSelectedSlot, getSelectedSlotByStartTimestamp } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class DateAndTime {
  constructor(
    private readonly mode: string,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { timeOfDay, dayOfTheWeek } = req.query as Record<string, string>
    const slotsList = await this.visitSessionsService.getVisitSessions({
      username: res.locals.user?.username,
      offenderNo: visitSessionData.prisoner.offenderNo,
      visitRestriction: visitSessionData.visitRestriction,
      timeOfDay,
      dayOfTheWeek,
    })

    let restrictionChangeMessage = ''
    let matchingSlot = ''
    let selectedSlot

    if (isUpdate && visitSessionData.visit?.id === '') {
      selectedSlot = getSelectedSlotByStartTimestamp(
        slotsList,
        visitSessionData.visit.startTimestamp,
        visitSessionData.visitRestriction,
      )

      if (selectedSlot) {
        matchingSlot = selectedSlot.id
      }

      if (visitSessionData.visitRestriction !== visitSessionData.originalVisitSlot?.visitRestriction) {
        if (!selectedSlot || selectedSlot.availableTables === 0) {
          if (visitSessionData.visitRestriction === 'CLOSED') {
            restrictionChangeMessage = 'A new visit time must be selected as this is now a closed visit.'
          } else {
            restrictionChangeMessage = 'A new visit time must be selected as this is now an open visit.'
          }
        } else if (selectedSlot && selectedSlot.availableTables > 0) {
          // can reserve slot here for same time, different restriction
          if (visitSessionData.visitRestriction === 'CLOSED') {
            restrictionChangeMessage = 'This is now a closed visit. The visit time can stay the same.'
          } else {
            restrictionChangeMessage = 'This is now an open visit. The visit time can stay the same.'
          }
        }
      }
    }

    let originalSelectedSlot
    if (isUpdate && visitSessionData.originalVisitSlot) {
      originalSelectedSlot = getSelectedSlotByStartTimestamp(
        slotsList,
        visitSessionData.originalVisitSlot.startTimestamp,
        visitSessionData.originalVisitSlot.visitRestriction,
      )
    }

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.visit?.id) {
      formValues['visit-date-and-time'] = visitSessionData.visit?.id
    }
    if (!Object.keys(formValues).length && matchingSlot) {
      formValues['visit-date-and-time'] = matchingSlot
    }

    const slotsPresent = Object.values(slotsList).some(value => value.length)

    req.session.slotsList = slotsList
    req.session.timeOfDay = timeOfDay
    req.session.dayOfTheWeek = dayOfTheWeek

    res.render('pages/bookAVisit/dateAndTime', {
      accordionId: uuidv4(),
      errors: req.flash('errors'),
      visitRestriction: visitSessionData.visitRestriction,
      prisonerName: visitSessionData.prisoner.name,
      closedVisitReason: visitSessionData.closedVisitReason,
      slotsList,
      timeOfDay,
      dayOfTheWeek,
      formValues,
      slotsPresent,
      restrictionChangeMessage,
      originalSelectedSlot,
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
      if (req.session.timeOfDay || req.session.dayOfTheWeek) {
        return res.redirect(
          `${req.originalUrl}?timeOfDay=${req.session.timeOfDay}&dayOfTheWeek=${req.session.dayOfTheWeek}`,
        )
      }
      return res.redirect(req.originalUrl)
    }

    visitSessionData.visit = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

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
      visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
      startTimestamp: visitSessionData.visit.startTimestamp,
      endTimestamp: visitSessionData.visit.endTimestamp,
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

  validateGet(): ValidationChain[] {
    return [
      query('timeOfDay').customSanitizer((value: string) => (!['morning', 'afternoon'].includes(value) ? '' : value)),
      query('dayOfTheWeek').customSanitizer((value: string) =>
        parseInt(value, 10) >= 0 && parseInt(value, 10) <= 6 ? value : '',
      ),
    ]
  }
}
