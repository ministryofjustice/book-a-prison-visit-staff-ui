import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import BlockVisitDatesController from './blockVisitDatesController'
import config from '../../config'
import BlockNewDateController from './blockNewDateController'

// @TODO remove line below when services no longer unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const blockVisitDatesController = new BlockVisitDatesController()
  const blockNewDateController = new BlockNewDateController()

  // serve 404 for any route if feature flag not set
  if (!config.features.sessionManagement) {
    router.use((req, res, next) => next(createHttpError(404)))
  }

  get('/', blockVisitDatesController.view())
  get('/block-new-date', blockNewDateController.view())

  return router
}
