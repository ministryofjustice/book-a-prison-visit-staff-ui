import { RequestHandler } from 'express'
import { VisitAllowanceService } from '../../services'

export default class ViewAllowancesController {
  public constructor(private readonly visitAllowanceService: VisitAllowanceService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonId } = req.session.selectedEstablishment
      const incentiveLevels = await this.visitAllowanceService.getPrisonIncentiveLevels({
        username: res.locals.user.username,
        prisonId,
      })

      return res.render('pages/visitAllowances/view', {
        message: req.flash('messages')?.[0],
        incentiveLevels,
      })
    }
  }

  public change(): RequestHandler {
    return async (req, res) => {
      return res.redirect('/visit-allowances/remand')
    }
  }
}
