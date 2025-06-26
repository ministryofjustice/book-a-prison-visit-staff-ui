import { Router } from 'express'
import { Services } from '../../services'
import VisitsReviewListingController from './visitsReviewListingController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitsReviewListing = new VisitsReviewListingController(services.visitNotificationsService)

  router.get('/', visitsReviewListing.validate(), visitsReviewListing.view())
  router.post('/', visitsReviewListing.validate(), visitsReviewListing.submit())

  return router
}
