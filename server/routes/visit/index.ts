import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import VisitDetailsController from './visitDetailsController'
import CancelVisitController from './cancelVisitController'
import { isValidVisitReference } from '../validationChecks'
import ClearNotificationsController from './clearNotificationsController'
import ConfirmUpdateController from './confirmUpdateController'
import UpdateVisitController from './updateVisitController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const visitDetails = new VisitDetailsController(services.auditService, services.visitService)
  const cancelVisit = new CancelVisitController(services.auditService, services.visitService)
  const clearNotifications = new ClearNotificationsController(services.auditService, services.visitNotificationsService)
  const confirmUpdate = new ConfirmUpdateController()
  const updateVisit = new UpdateVisitController(services.visitService)

  // middleware to ensure valid visit reference for all /visit/:reference routes
  router.use('/:reference', (req, res, next) => {
    const { reference } = req.params
    if (!isValidVisitReference(reference)) {
      throw new BadRequest()
    }
    next()
  })

  get('/:reference', visitDetails.view())
  post('/:reference', updateVisit.startVisitUpdate())

  get('/:reference/cancel', cancelVisit.showCancellationReasons())
  postWithValidation('/:reference/cancel', cancelVisit.validate(), cancelVisit.cancelVisit())

  get('/:reference/cancelled', cancelVisit.cancelConfirmation())

  get('/:reference/clear-notifications', clearNotifications.view())
  postWithValidation(
    '/:reference/clear-notifications',
    clearNotifications.validate(),
    clearNotifications.clearNotifications(),
  )

  get('/:reference/confirm-update', confirmUpdate.viewConfirmUpdate())
  post('/:reference/confirm-update', confirmUpdate.submitConfirmUpdate())

  return router
}
