import { RequestHandler } from 'express'
import { AuditService, VisitOrdersService } from '../../../services'
import visitBalanceAdjustmentReasons from '../../../constants/visitBalanceAdjustmentReasons'

export default class EditVisitOrdersBalancesController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitOrdersService: VisitOrdersService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment

      const prisonerVoBalance = await this.visitOrdersService.getVoBalance({
        username: res.locals.user.username,
        prisonId,
        prisonerId,
      })

      // TODO handle 'formValues' to pre-populate form

      return res.render('pages/prisoner/visitOrders/editVoBalance', {
        errors: req.flash('errors'),
        prisonerId,
        prisonerVoBalance,
        visitBalanceAdjustmentReasons,
      })
    }
  }

  // TODO POST route
  // TODO send audit

  // TODO form validations
}
