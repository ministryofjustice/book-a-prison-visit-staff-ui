import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BlockDatesOrSessionsService, VisitSessionsService } from '../../../services'
import logger from '../../../../logger'
import { getSessionUnblockedMessage } from './blockSessionsMessages'

export default class UnblockSessionController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.redirect('/block-visit-dates')
      }

      const { date, sessionTemplateReference } = matchedData<{ date: string; sessionTemplateReference: string }>(req)
      const { username } = res.locals.user

      try {
        await this.blockDatesOrSessionsService.unblockVisitSession({
          sessionTemplateReference,
          date,
          username,
        })

        const sessionSchedule = await this.visitSessionsService.getSessionSchedule({
          username,
          prisonId: req.session.selectedEstablishment.prisonId,
          date,
          includeExcludedSessions: true,
        })

        const unblockedSession = sessionSchedule.find(
          session => session.sessionTemplateReference === sessionTemplateReference,
        )

        if (unblockedSession) {
          req.flash('messages', getSessionUnblockedMessage({ date, session: unblockedSession }))
        }

        await this.auditService.unblockedVisitSession({
          date,
          sessionReference: unblockedSession.sessionTemplateReference,
          username,
          operationId: res.locals.appInsightsOperationId,
        })
      } catch (error) {
        logger.error(error, `Could not unblock visit session ${date} for ${username}`)
      }

      return res.redirect('/block-visit-dates')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('date').isDate({ format: 'YYYY-MM-DD', strictMode: true }),

      body('sessionTemplateReference')
        .isLength({ min: 10, max: 20 })
        .matches(/^[\w-\\.]+$/),
    ]
  }
}
