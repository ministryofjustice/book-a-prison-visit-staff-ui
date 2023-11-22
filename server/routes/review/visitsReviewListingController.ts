import { RequestHandler } from 'express'
import { VisitNotificationsService } from '../../services'
import {
  notificationTypes,
  notificationTypePathSegments,
  notificationTypeDescriptions,
} from '../../constants/notificationEventTypes'

export default class VisitsReviewListingController {
  public constructor(private readonly visitNotificationsService: VisitNotificationsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonName } = req.session.selectedEstablishment
      const visitsReviewList = await this.visitNotificationsService.getVisitsReviewList(
        res.locals.user.username,
        req.session.selectedEstablishment.prisonId,
      )

      return res.render('pages/review/visitsReviewListing', {
        notificationTypes,
        notificationTypeDescriptions: Object.values(notificationTypeDescriptions),
        notificationTypePathSegments,
        prisonName,
        visitsReviewList,
      })
    }
  }
}
