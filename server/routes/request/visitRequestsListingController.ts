import { RequestHandler } from 'express'
import { VisitRequestsService } from '../../services'

export default class VisitRequestsListingController {
  public constructor(private readonly visitRequestsService: VisitRequestsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedEstablishment } = req.session

      const visitRequests = await this.visitRequestsService.getVisitRequests(
        res.locals.user.username,
        selectedEstablishment.prisonId,
      )

      return res.render('pages/request/visitRequestsListing', {
        checkBeforeDays: selectedEstablishment.policyNoticeDaysMin,
        prisonName: selectedEstablishment.prisonName,
        visitRequests,
      })
    }
  }
}
