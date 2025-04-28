import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitSessionsService } from '../../services'
import { BookOrUpdate } from '../../@types/bapv'

export default class Overbooking {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  async viewFromSelectDateTime(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const urlPrefix = getUrlPrefix(isUpdate)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/select-date-and-time/overbooking`)
    }

    const maxCapacity = visitSessionData.visitSlot.capacity
    const bookingsCount = maxCapacity - visitSessionData.visitSlot.availableTables

    return res.render('pages/bookAVisit/overbooking', {
      errors: req.flash('errors'),
      bookingsCount,
      maxCapacity,
      visitSession: visitSessionData.visitSlot,
      backLinkHref: `${urlPrefix}/select-date-and-time`,
    })
  }

  async viewFromCheckBooking(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const urlPrefix = getUrlPrefix(isUpdate)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/check-your-booking/overbooking`)
    }

    const visitSession = await this.visitSessionsService.getSingleVisitSession({
      prisonCode: visitSessionData.visitSlot.prisonId,
      sessionDate: visitSessionData.visitSlot.startTimestamp.split('T')[0],
      sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
      username: req.user.username,
    })

    const bookingsCount =
      visitSessionData.visitSlot.visitRestriction === 'OPEN'
        ? visitSession.openVisitBookedCount
        : visitSession.closedVisitBookedCount

    const maxCapacity =
      visitSessionData.visitSlot.visitRestriction === 'OPEN'
        ? visitSession.openVisitCapacity
        : visitSession.closedVisitCapacity

    return res.render('pages/bookAVisit/overbooking', {
      errors: req.flash('errors'),
      validationAlert: req.flash('messages'),
      bookingsCount,
      maxCapacity,
      visitSession,
      backLinkHref: `${urlPrefix}/check-your-booking`,
    })
  }

  validate(): ValidationChain {
    return body('confirmOverBooking').isIn(['yes', 'no']).withMessage('No answer selected')
  }
}
