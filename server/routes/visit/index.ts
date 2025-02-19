import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitDetailsController from './visitDetailsController'
import CancelVisitController from './cancelVisitController'
import { isValidVisitReference } from '../validationChecks'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const visitDetails = new VisitDetailsController(
    services.auditService,
    services.prisonerSearchService,
    services.supportedPrisonsService,
    services.visitService,
  )
  const cancelVisit = new CancelVisitController(services.auditService, services.visitService)

  // middleware to ensure valid visit reference
  // happens at this level to stop duplication
  router.use('/:reference', (req, res, next) => {
    const { reference } = req.params
    if (!isValidVisitReference(reference)) {
      throw new BadRequest()
    }
    next()
  })

  get('/:reference', visitDetails.view())

  get('/:reference/cancel', cancelVisit.showCancellationReasons())
  postWithValidation('/:reference/cancel', cancelVisit.validate(), cancelVisit.cancelVisit())

  get('/:reference/cancelled', cancelVisit.cancelConfirmation())

  return router
}
