import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { format } from 'date-fns'
import { BlockedDatesService } from '../../services'
import logger from '../../../logger'

export default class UnblockVisitDateController {
  public constructor(private readonly blockedDatesService: BlockedDatesService) {}

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.redirect('/block-visit-dates')
      }

      const { date } = matchedData<{ date: string }>(req)
      const { prisonId } = req.session.selectedEstablishment

      try {
        await this.blockedDatesService.unblockVisitDate(res.locals.user.username, prisonId, date)
        req.flash('message', `Visits are unblocked for ${format(date, 'EEEE d MMMM yyyy')}.`)
      } catch (error) {
        logger.error(error, `Could not unblock visit date ${date} for ${res.locals.user.username}`)
      }

      return res.redirect('/block-visit-dates')
    }
  }

  public validate(): ValidationChain[] {
    return [body('date').isDate({ format: 'YYYY-MM-DD', strictMode: true })]
  }
}
