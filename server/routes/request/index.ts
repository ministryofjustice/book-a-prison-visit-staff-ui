import { Router } from 'express'
import { Services } from '../../services'
import VisitsRequestsListingController from './visitRequestsListingController'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const visitsReviewListing = new VisitsRequestsListingController(services.visitRequestsService)

  if (config.features.visitRequest) {
    router.get('/', visitsReviewListing.view())
  }

  return router
}
