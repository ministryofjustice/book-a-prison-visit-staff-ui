import { RequestHandler } from 'express'
import { VisitOrdersService } from '../../../services'
import { PrisonerParams } from '../../../@types/requestParameterTypes'

export default class VisitOrdersHistoryController {
  public constructor(private readonly visitOrdersService: VisitOrdersService) {}

  public view(): RequestHandler<PrisonerParams> {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment

      const { voHistoryRows, ...prisonerDetails } = await this.visitOrdersService.getVoHistory({
        username: res.locals.user.username,
        prisonId,
        prisonerId,
      })

      return res.render('pages/prisoner/visitOrders/voHistory', {
        prisonerId,
        prisonerDetails,
        voHistoryRows,
      })
    }
  }
}
