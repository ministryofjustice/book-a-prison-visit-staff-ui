import url from 'url'
import { RequestHandler } from 'express'
import { ValidationChain, check } from 'express-validator'
import { VisitNotificationsService } from '../../services'
import { notificationTypes, notificationTypeReasons } from '../../constants/notifications'
import { buildVisitsToReviewList, getVisitNotificationFilters } from './reviewUtils'

export default class VisitsReviewListingController {
  public constructor(private readonly visitNotificationsService: VisitNotificationsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { selectedEstablishment } = req.session
      const { username } = res.locals.user

      // TODO use matchedData()
      // OK to cast these as express-validator sanitises to string[]
      const bookedBy = Array.isArray(req.query.bookedBy) ? <string[]>req.query.bookedBy : []
      const type = Array.isArray(req.query.type) ? <string[]>req.query.type : []

      const visitNotifications = await this.visitNotificationsService.getVisitNotifications({
        username,
        prisonId: selectedEstablishment.prisonId,
      })

      const filters = getVisitNotificationFilters({ visitNotifications, username, appliedFilters: { bookedBy, type } })

      // const { filters, visitsReviewList } = await this.visitNotificationsService.getVisitsReviewList(
      //   res.locals.user.username,
      //   req.session.selectedEstablishment.prisonId,
      //   { bookedBy, type },
      // )
      const visitsReviewList = buildVisitsToReviewList(visitNotifications)

      const isAFilterApplied = true // filters.some(filter => filter.items.some(item => item.checked))

      return res.render('pages/review/visitsReviewListing', {
        // TODO review these vars
        notificationTypes,
        notificationTypeDescriptions: Object.values(notificationTypeReasons),
        prisonName: selectedEstablishment.prisonName,
        filters,
        visitsReviewList,
        isAFilterApplied,
        visitNotifications,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      // OK to cast these as express-validator sanitises to string[]
      const bookedBy = Array.isArray(req.body.bookedBy) ? <string[]>req.body.bookedBy : []
      const type = Array.isArray(req.body.type) ? <string[]>req.body.type : []

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
