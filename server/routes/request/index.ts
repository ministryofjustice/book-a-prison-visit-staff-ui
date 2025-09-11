import { Router } from 'express'
import { Services } from '../../services'
import VisitsRequestsListingController from './visitRequestsListingController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitsReviewListing = new VisitsRequestsListingController(services.visitRequestsService)

  router.get('/', visitsReviewListing.view())

  return router
}
