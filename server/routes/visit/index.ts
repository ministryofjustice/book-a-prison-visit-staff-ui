import { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitDetailsController from './visitDetailsController'
import { isValidVisitReference } from '../validationChecks'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  // middleware to ensure valid visit reference
  router.use('/:reference', (req, res, next) => {
    const { reference } = req.params
    if (!isValidVisitReference(reference)) {
      throw new BadRequest()
    }
    next()
  })

  const visitDetails = new VisitDetailsController(
    services.auditService,
    services.prisonerSearchService,
    services.supportedPrisonsService,
    services.visitService,
  )

  get('/:reference', visitDetails.view())

  return router
}
