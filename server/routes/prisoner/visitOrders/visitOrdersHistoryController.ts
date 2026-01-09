import { RequestHandler } from 'express'
import { VisitOrdersService } from '../../../services'

// TODO unit tests for this controller
export default class VisitOrdersHistoryController {
  public constructor(private readonly visitOrdersService: VisitOrdersService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params

      const { voHistoryRows, ...prisonerDetails } = await this.visitOrdersService.getVoHistory({
        username: res.locals.user.username,
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
