import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { getParsedDateFromQueryString } from '../../utils/utils'

export default class VisitPassesController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const date = getParsedDateFromQueryString(req.query.date?.toString())
      const { prisonId } = req.session.selectedEstablishment
      const { username } = res.locals.user

      const visitPasses = await this.visitService.getVisitPasses({ prisonId, date, username })

      // TODO send audit event

      res.render('pages/visitPasses/visitPasses', {
        visitPasses,
      })
    }
  }
}
