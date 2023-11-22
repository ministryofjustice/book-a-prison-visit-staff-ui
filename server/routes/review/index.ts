import { RequestHandler, Router } from 'express'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitsReviewListingController from './visitsReviewListingController'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const visitsReviewListing = new VisitsReviewListingController(services.visitNotificationsService)

  if (config.features.showReviewBookingsTile) {
    get('/', visitsReviewListing.view())
  }

  return router
}
