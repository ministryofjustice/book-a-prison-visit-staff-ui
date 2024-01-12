import url from 'url'
import { RequestHandler } from 'express'
import { ValidationChain, check } from 'express-validator'
import { VisitNotificationsService } from '../../services'
import { notificationTypes, notificationTypeDescriptions } from '../../constants/notificationEventTypes'

export default class VisitsReviewListingController {
  public constructor(private readonly visitNotificationsService: VisitNotificationsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonName } = req.session.selectedEstablishment
      // OK to cast these as express-validator sanitises to string[]
      const bookedBy = Array.isArray(req.query.bookedBy) ? <string[]>req.query.bookedBy : []
      const type = Array.isArray(req.query.type) ? <string[]>req.query.type : []

      const { filters, visitsReviewList } = await this.visitNotificationsService.getVisitsReviewList(
        res.locals.user.username,
        req.session.selectedEstablishment.prisonId,
        { bookedBy, type },
      )

      const isAFilterApplied = filters.some(filter => filter.items.some(item => item.checked))

      return res.render('pages/review/visitsReviewListing', {
        notificationTypes,
        notificationTypeDescriptions: Object.values(notificationTypeDescriptions),
        prisonName,
        filters,
        visitsReviewList,
        isAFilterApplied,
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
