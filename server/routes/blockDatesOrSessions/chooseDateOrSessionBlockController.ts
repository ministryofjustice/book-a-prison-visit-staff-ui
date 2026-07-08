import { RequestHandler } from 'express'
import { AuditService, BlockDatesOrSessionsService } from '../../services'
import logger from '../../../logger'

export default class ChooseDateOrSessionBlockController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      // FIXME temporary redirect until session block pages built
      logger.info('Block session page: redirecting to block new date page')
      return res.redirect('/block-visit-dates/block-new-date')
    }
  }
}
