import url from 'url'
import { RequestHandler } from 'express'
import { ValidationChain, check } from 'express-validator'
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
      const { bookedBy = [], type = [] } = req.query as Record<string, string[]> // OK to cast this express-validator sanitises

      const { filters, visitsReviewList } = await this.visitNotificationsService.getVisitsReviewList(
        res.locals.user.username,
        req.session.selectedEstablishment.prisonId,
        { bookedBy, type },
      )

      const isAFilterApplied = filters.some(filter => filter.items.some(item => item.checked))

      return res.render('pages/review/visitsReviewListing', {
        notificationTypes,
        notificationTypeDescriptions: Object.values(notificationTypeDescriptions),
        notificationTypePathSegments,
        prisonName,
        filters,
        visitsReviewList,
        isAFilterApplied,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookedBy, type } = req.body

      return res.redirect(
        url.format({
          pathname: '/review',
          query: {
            ...(bookedBy && { bookedBy }),
            ...(type && { type }),
          },
        }),
      )
    }
  }

  public validate(): ValidationChain[] {
    return [check('bookedBy').toArray(), check('type').toArray()]
  }
}
