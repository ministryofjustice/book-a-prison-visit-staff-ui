import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import AuditService from '../../services/auditService'

export default class VisitType {
  constructor(private readonly mode: string, private readonly auditService: AuditService) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']

    const closedRestrictions = sessionData.prisoner.restrictions.filter(
      restriction => restriction.restrictionType === 'CLOSED',
    )

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/visitType`, {
      errors: req.flash('errors'),
      restrictions: closedRestrictions,
      visitors: sessionData.visitors,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(req.originalUrl)
    }

    sessionData.visitRestriction = req.body.visitType
    sessionData.closedVisitReason = req.body.visitType === 'CLOSED' ? 'prisoner' : undefined

    await this.auditService.visitRestrictionSelected(
      sessionData.prisoner.offenderNo,
      sessionData.visitRestriction,
      sessionData.visitors.map(visitor => visitor.personId.toString()),
      res.locals.user?.username,
      res.locals.appInsightsOperationId,
    )

    const urlPrefix = isUpdate ? `/visit/${sessionData.visitReference}/update` : '/book-a-visit'

    return res.redirect(`${urlPrefix}/select-date-and-time`)
  }

  validate(): ValidationChain {
    return body('visitType').isIn(['OPEN', 'CLOSED']).withMessage('No visit type selected')
  }
}
