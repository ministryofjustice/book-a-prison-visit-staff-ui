import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitsReviewListingController from './visitsReviewListingController'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const getWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.get(path, ...validationChain, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const visitsReviewListing = new VisitsReviewListingController(services.visitNotificationsService)

  if (config.features.reviewBookings) {
    getWithValidation('/', visitsReviewListing.validate(), visitsReviewListing.view())
    postWithValidation('/', visitsReviewListing.validate(), visitsReviewListing.submit())
  }

  return router
}
