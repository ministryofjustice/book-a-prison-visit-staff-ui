import { RequestHandler } from 'express'
import { VisitAllowanceService } from '../../services'

export default class ViewAllowancesController {
  public constructor(private readonly visitAllowanceService: VisitAllowanceService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonId } = req.session.selectedEstablishment
      const incentiveLevels = await this.visitAllowanceService.getIncentivesLevels({
        username: res.locals.user.username,
        prisonId,
      })

      // console.log(incentiveLevels)

      return res.render('pages/visitAllowances/view', {
        incentiveLevels,
      })
    }
  }

  public change(): RequestHandler {
    return async (req, res) => {
      return res.redirect('/block-visit-dates')
    }
  }
}
