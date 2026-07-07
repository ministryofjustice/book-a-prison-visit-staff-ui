import { RequestHandler } from 'express'
import { VisitAllowanceService } from '../../services'
import bapvUserRoles from '../../constants/bapvUserRoles'

export default class ViewAllowancesController {
  public constructor(private readonly visitAllowanceService: VisitAllowanceService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonId } = req.session.selectedEstablishment
      const { username, userRoles } = res.locals.user

      const [prisonConfig, incentiveLevels] = await Promise.all([
        this.visitAllowanceService.getRemandConfig({
          username,
          prisonId,
        }),
        this.visitAllowanceService.getPrisonIncentiveLevels({
          username,
          prisonId,
        }),
      ])

      const userHasIepManagementRole = userRoles.includes(bapvUserRoles.PRISON_IEP_ADMIN)

      return res.render('pages/visitAllowances/view', {
        message: req.flash('messages')?.[0],
        incentiveLevels,
        prisonConfig,
        userHasIepManagementRole,
      })
    }
  }

  public change(): RequestHandler {
    return async (req, res) => {
      return res.redirect('/visit-allowances/remand')
    }
  }
}
