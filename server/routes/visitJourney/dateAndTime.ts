import type { Request, Response } from 'express'
import { body, query, ValidationChain, validationResult } from 'express-validator'
import { VisitSlot } from '../../@types/bapv'
import AuditService from '../../services/auditService'
import VisitSessionsService from '../../services/visitSessionsService'
import { getFlashFormValues, getSelectedSlot, getSelectedSlotByStartTimestamp } from '../visitorUtils'

export default class DateAndTime {
  constructor(
    private readonly mode: string,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const { timeOfDay, dayOfTheWeek } = req.query as Record<string, string>
    const slotsList = await this.visitSessionsService.getVisitSessions({
      username: res.locals.user?.username,
      offenderNo: sessionData.prisoner.offenderNo,
      visitRestriction: sessionData.visitRestriction,
      timeOfDay,
      dayOfTheWeek,
    })

    let restrictionChangeMessage = ''
    let matchingSlot = ''
    let selectedSlot

    if (isUpdate && sessionData.visit?.id === '') {
      selectedSlot = getSelectedSlotByStartTimestamp(
        slotsList,
        sessionData.visit.startTimestamp,
        sessionData.visitRestriction,
      )

      if (selectedSlot) {
        matchingSlot = selectedSlot.id
      }

      if (sessionData.visitRestriction !== sessionData.previousVisitRestriction) {
        if (!selectedSlot || selectedSlot.availableTables === 0) {
          if (sessionData.visitRestriction === 'CLOSED') {
            restrictionChangeMessage = 'A new visit time must be selected as this is now a closed visit.'
          } else {
            restrictionChangeMessage = 'A new visit time must be selected as this is now an open visit.'
          }
        } else if (selectedSlot && selectedSlot.availableTables > 0) {
          // can reserve slot here for same time, different restriction
          if (sessionData.visitRestriction === 'CLOSED') {
            restrictionChangeMessage = 'This is now a closed visit. The visit time can stay the same.'
          } else {
            restrictionChangeMessage = 'This is now an open visit. The visit time can stay the same.'
          }
        }
      }
    }

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && sessionData.visit?.id) {
      formValues['visit-date-and-time'] = sessionData.visit?.id
    }
    if (!Object.keys(formValues).length && matchingSlot) {
      formValues['visit-date-and-time'] = matchingSlot
    }

    const slotsPresent = Object.values(slotsList).some(value => value.length)

    req.session.slotsList = slotsList
    req.session.timeOfDay = timeOfDay
    req.session.dayOfTheWeek = dayOfTheWeek

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/dateAndTime`, {
      errors: req.flash('errors'),
      visitRestriction: sessionData.visitRestriction,
      prisonerName: sessionData.prisoner.name,
      closedVisitReason: sessionData.closedVisitReason,
      slotsList,
      timeOfDay,
      dayOfTheWeek,
      formValues,
      slotsPresent,
      reference: sessionData.visitReference,
      restrictionChangeMessage,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
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

    sessionData.visit = getSelectedSlot(req.session.slotsList, req.body['visit-date-and-time'])

    if (sessionData.visitReference) {
      await this.visitSessionsService.updateVisit({
        username: res.locals.user?.username,
        visitData: sessionData,
      })
    } else {
      const { reference, visitStatus } = await this.visitSessionsService.createVisit({
        username: res.locals.user?.username,
        visitData: sessionData,
      })

      sessionData.visitReference = reference
      sessionData.visitStatus = visitStatus
    }

    await this.auditService.reservedVisit(
      sessionData.visitReference,
      sessionData.prisoner.offenderNo,
      'HEI',
      res.locals.user?.username,
      res.locals.appInsightsOperationId,
    )

    const urlPrefix = isUpdate ? `/visit/${sessionData.visitReference}/update` : '/book-a-visit'

    return res.redirect(`${urlPrefix}/additional-support`)
  }

  validate(): ValidationChain {
    return body('visit-date-and-time').custom((value: string, { req }) => {
      // check selected slot is in the list that was shown and has available tables
      const selectedSlot: VisitSlot = getSelectedSlot(req.session.slotsList, value)

      if (selectedSlot === undefined || selectedSlot.availableTables === 0) {
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
