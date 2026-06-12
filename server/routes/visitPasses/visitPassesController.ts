import { RequestHandler, Request } from 'express'
import { format, isBefore, startOfToday } from 'date-fns'
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

      if (isBefore(date, startOfToday())) {
        return res.redirect('/visits')
      }

      const visitPassDtos = await this.visitService.getVisitPasses({ prisonId, date, username })

      const visitPasses = visitPassDtos.map(buildVisitPass)

      // TODO send audit event

      return res.render('pages/visitPasses/visitPasses', {
        backLinkHref: this.getBacklinkHref(req.query),
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

      if (isBefore(visitPassDto.visitDate, startOfToday())) {
        return res.redirect(`/visit/${reference}`)
      }

      const visitPass = buildVisitPass(visitPassDto)

      // TODO send audit event

      return res.render('pages/visitPasses/visitPasses', {
        backLinkHref: this.getBacklinkHref(req.query, reference),
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

  private getBacklinkHref({ from, query }: Request['query'], reference?: string): string {
    switch (from) {
      case 'visit':
        return `/visit/${reference}`

      case 'visits':
        return `/visits?${query}`

      default:
        return '/'
    }
  }
}
