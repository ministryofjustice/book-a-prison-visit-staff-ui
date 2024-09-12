import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import BlockVisitDatesController from './blockVisitDatesController'
import config from '../../config'
import BlockNewDateController from './blockNewDateController'
import UnblockVisitDateController from './unblockVisitDateController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const blockVisitDatesController = new BlockVisitDatesController(services.blockedDatesService)
  const blockNewDateController = new BlockNewDateController(
    services.auditService,
    services.blockedDatesService,
    services.visitService,
  )
  const unblockVisitDateController = new UnblockVisitDateController(services.auditService, services.blockedDatesService)

  // serve 404 for any route if feature flag not set
  if (!config.features.sessionManagement) {
    router.use((req, res, next) => next(createHttpError(404)))
  }

  get('/', blockVisitDatesController.view())
  postWithValidation('/', blockVisitDatesController.validate(), blockVisitDatesController.submit())

  get('/block-new-date', blockNewDateController.view())
  postWithValidation('/block-new-date', blockNewDateController.validate(), blockNewDateController.submit())

  postWithValidation('/unblock-date', unblockVisitDateController.validate(), unblockVisitDateController.submit())

  return router
}
