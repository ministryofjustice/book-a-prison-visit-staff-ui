import url from 'url'
import { RequestHandler } from 'express'
import { ValidationChain, check, matchedData } from 'express-validator'
import { VisitNotificationsService } from '../../services'
import { notificationTypeReasons } from '../../constants/notifications'
import {
  AppliedFilters,
  buildVisitsToReviewList,
  filterVisitNotifications,
  getVisitNotificationFilters,
} from './reviewUtils'

export default class VisitsReviewListingController {
  public constructor(private readonly visitNotificationsService: VisitNotificationsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedEstablishment } = req.session
      const { username } = res.locals.user

      const { bookedBy = [], type = [] } = matchedData<AppliedFilters>(req, { locations: ['query'] })

      const visitNotifications = await this.visitNotificationsService.getVisitNotifications({
        username,
        prisonId: selectedEstablishment.prisonId,
      })

      const filters = getVisitNotificationFilters({ visitNotifications, username, appliedFilters: { bookedBy, type } })
      const isAFilterApplied = filters.some(filter => filter.items.some(item => item.checked))

      const filteredVisitNotifications = filterVisitNotifications({
        appliedFilters: { bookedBy, type },
        visitNotifications,
      })
      const visitsReviewList = buildVisitsToReviewList(filteredVisitNotifications)

      return res.render('pages/review/visitsReviewListing', {
        notificationTypeDescriptions: Object.values(notificationTypeReasons),
        prisonName: selectedEstablishment.prisonName,
        filters,
        isAFilterApplied,
        visitsReviewList,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookedBy, type } = matchedData<AppliedFilters>(req, { locations: ['body'] })

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
