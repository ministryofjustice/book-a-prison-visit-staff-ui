import { RequestHandler } from 'express'
import { format } from 'date-fns'
import { AuditService, VisitService } from '../../services'
import { getParsedDateFromQueryString } from '../../utils/utils'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import { buildVisitPass } from './visitPassBuilder'

export default class VisitPassesController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public viewByDate(): RequestHandler {
    return async (req, res) => {
      const date = getParsedDateFromQueryString(req.query.date?.toString())
      const { prisonId, prisonName } = req.session.selectedEstablishment
      const { username } = res.locals.user

      const visitPassDtos = await this.visitService.getVisitPasses({ prisonId, date, username })

      const visitPasses = visitPassDtos.map(buildVisitPass)

      // TODO send audit event

      res.render('pages/visitPasses/visitPasses', {
        prisonName,
        singlePass: false,
        visitPasses,
        createdDate: this.getCreatedDate(),
      })
    }
  }

  public viewByVisit(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const { reference } = req.params
      const { prisonId, prisonName } = req.session.selectedEstablishment
      const { username } = res.locals.user

      const visitPassDto = await this.visitService.getVisitPass({ prisonId, reference, username })

      const visitPass = buildVisitPass(visitPassDto)

      // TODO send audit event

      res.render('pages/visitPasses/visitPasses', {
        prisonName,
        singlePass: true,
        visitPasses: [visitPass],
        createdDate: this.getCreatedDate(),
      })
    }
  }

  private getCreatedDate(): string {
    return format(new Date(), "EEEE d MMMM yyyy 'at' h:mmaaa")
  }
}
