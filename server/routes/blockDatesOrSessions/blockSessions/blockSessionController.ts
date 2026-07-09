import { RequestHandler } from 'express'
import { AuditService, BlockDatesOrSessionsService, VisitService } from '../../../services'

export default class BlockSessionController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      // TODO implement block session view functionality - temporary redirect to avoid 404s
      res.redirect('/block-visit-dates/block-date-or-session')
    }
  }
}
