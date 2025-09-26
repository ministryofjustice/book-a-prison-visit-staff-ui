import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitSessionsService } from '../../services'
import { BookOrUpdate } from '../../@types/bapv'
import { formatStartToEndTime } from '../../utils/utils'

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

    const { capacity, date, startTime, endTime } = visitSessionData.selectedVisitSession
    const bookingsCount = capacity - visitSessionData.selectedVisitSession.availableTables
    const time = formatStartToEndTime(startTime, endTime)

    return res.render('pages/bookAVisit/overbooking', {
      errors: req.flash('errors'),
      bookingsCount,
      capacity,
      time,
      date,
      backLinkHref: `${urlPrefix}/select-date-and-time`,
    })
  }

  // similar to above but needs to request current booking count as this could have changed
  async viewFromCheckBooking(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const urlPrefix = getUrlPrefix(isUpdate)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/check-your-booking/overbooking`)
    }

    const { capacity, date, startTime, endTime } = visitSessionData.selectedVisitSession
    const time = formatStartToEndTime(startTime, endTime)

    const visitSession = await this.visitSessionsService.getSingleVisitSession({
      prisonCode: visitSessionData.prisonId,
      sessionDate: visitSessionData.selectedVisitSession.date,
      sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
      username: req.user.username,
    })

    const bookingsCount =
      visitSessionData.visitRestriction === 'OPEN'
        ? visitSession.openVisitBookedCount
        : visitSession.closedVisitBookedCount

    return res.render('pages/bookAVisit/overbooking', {
      errors: req.flash('errors'),
      message: req.flash('messages')?.[0],
      bookingsCount,
      capacity,
      time,
      date,
      backLinkHref: `${urlPrefix}/check-your-booking`,
    })
  }

  validate(): ValidationChain {
    return body('confirmOverBooking').isIn(['yes', 'no']).withMessage('No answer selected')
  }
}
