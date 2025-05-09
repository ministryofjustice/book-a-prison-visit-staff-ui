import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { format } from 'date-fns'
import { AuditService, BlockedDatesService } from '../../services'
import logger from '../../../logger'

export default class UnblockVisitDateController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockedDatesService: BlockedDatesService,
  ) {}

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

        req.flash('messages', {
          variant: 'success',
          title: 'Date unblocked for visits',
          text: `Visits are unblocked for ${format(date, 'EEEE d MMMM yyyy')}.`,
        })

        await this.auditService.unblockedVisitDate({
          prisonId,
          date,
          username: res.locals.user.username,
          operationId: res.locals.appInsightsOperationId,
        })
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
