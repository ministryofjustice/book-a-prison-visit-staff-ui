import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { format, parseISO } from 'date-fns'
import { AuditService, BlockDatesOrSessionsService, VisitService } from '../../../services'
import logger from '../../../../logger'

export default class BlockDateController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { blockDateOrSession } = req.session
      const { backLinkHref, date } = blockDateOrSession

      const { prisonId } = req.session.selectedEstablishment
      const visitCount = await this.visitService.getBookedVisitCountByDate({
        username: res.locals.user.username,
        prisonId,
        date,
      })

      return res.render('pages/blockDatesOrSessions/blockDates/blockDate', {
        backLinkHref,
        errors: req.flash('errors'),
        date,
        visitCount,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates-or-sessions/block-new-date')
      }

      const { blockDateOrSession } = req.session
      const { confirmBlockDate } = matchedData<{ confirmBlockDate: 'yes' | 'no' }>(req)

      if (confirmBlockDate === 'yes') {
        const { prisonId } = req.session.selectedEstablishment
        const { date } = blockDateOrSession

        try {
          await this.blockDatesOrSessionsService.blockVisitDate(res.locals.user.username, prisonId, date)

          req.flash('messages', {
            variant: 'success',
            title: 'Date blocked for visits',
            text: `Visits are blocked for ${format(parseISO(date), 'EEEE d MMMM yyyy')}.`,
          })

          await this.auditService.blockedVisitDate({
            prisonId,
            date,
            username: res.locals.user.username,
            operationId: res.locals.appInsightsOperationId,
          })
        } catch (error) {
          logger.error(error, `Could not block visit date ${date} for ${res.locals.user.username}`)
        }
      }

      delete req.session.blockDateOrSession
      return res.redirect('/block-visit-dates-or-sessions')
    }
  }

  public validate(): ValidationChain[] {
    return [body('confirmBlockDate', 'No answer selected').isIn(['yes', 'no'])]
  }
}
