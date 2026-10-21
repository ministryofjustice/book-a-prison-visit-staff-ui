import { RequestHandler } from 'express'
import { VisitOrdersService } from '../../../services'
import { PrisonerParams } from '../../../@types/requestTypes'

export default class VisitOrdersHistoryController {
  public constructor(private readonly visitOrdersService: VisitOrdersService) {}

  public view(): RequestHandler<PrisonerParams> {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = res.locals.selectedEstablishment

      const { voHistoryRows, ...prisonerDetails } = await this.visitOrdersService.getVoHistory({
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
