import { RequestHandler } from 'express'
import { VisitOrdersService } from '../../../services'

// TODO unit tests for this controller
export default class VisitOrdersHistoryController {
  public constructor(private readonly visitOrdersService: VisitOrdersService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params

      const { prisonerDetails, historyItems } = await this.visitOrdersService.getVoHistory({
        prisonerId,
        username: res.locals.user.username,
      })

      return res.render('pages/prisoner/voHistory', {
        prisonerId,
        prisonerDetails,
        historyItems,
      })
    }
  }
}
