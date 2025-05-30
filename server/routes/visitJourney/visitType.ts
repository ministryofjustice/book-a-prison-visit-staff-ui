import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import AuditService from '../../services/auditService'
import { getUrlPrefix } from './visitJourneyUtils'
import { BookOrUpdate } from '../../@types/bapv'

export default class VisitType {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly auditService: AuditService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const closedRestrictions = visitSessionData.prisoner.restrictions.filter(
      restriction => restriction.restrictionType === 'CLOSED',
    )

    res.render('pages/bookAVisit/visitType', {
      errors: req.flash('errors'),
      restrictions: closedRestrictions,
      visitors: visitSessionData.visitors,
      urlPrefix: getUrlPrefix(isUpdate),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/visit-type`)
    }

    visitSessionData.visitRestriction = req.body.visitType

    await this.auditService.visitRestrictionSelected({
      prisonerId: visitSessionData.prisoner.offenderNo,
      visitRestriction: visitSessionData.visitRestriction,
      visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

    return res.redirect(`${urlPrefix}/select-date-and-time`)
  }

  validate(): ValidationChain {
    return body('visitType').isIn(['OPEN', 'CLOSED']).withMessage('No visit type selected')
  }
}
