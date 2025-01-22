import { RequestHandler, Router } from 'express'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitDetailsController from './visitDetailsController'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const visitDetails = new VisitDetailsController()

  get('/:reference', visitDetails.view())

  return router
}
