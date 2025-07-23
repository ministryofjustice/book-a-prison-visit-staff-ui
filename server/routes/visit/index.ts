import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import VisitDetailsController from './visitDetailsController'
import CancelVisitController from './cancelVisitController'
import { isValidVisitReference } from '../validationChecks'
import ClearNotificationsController from './clearNotificationsController'
import ConfirmUpdateController from './confirmUpdateController'
import UpdateVisitController from './updateVisitController'

export default function routes(services: Services): Router {
  const router = Router()

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

  router.get('/:reference', visitDetails.view())
  router.post('/:reference/update', updateVisit.startVisitUpdate())

  router.get('/:reference/cancel', cancelVisit.showCancellationReasons())
  router.post('/:reference/cancel', cancelVisit.validate(), cancelVisit.cancelVisit())

  router.get('/:reference/cancelled', cancelVisit.cancelConfirmation())

  router.get('/:reference/clear-notifications', clearNotifications.view())
  router.post('/:reference/clear-notifications', clearNotifications.validate(), clearNotifications.clearNotifications())

  router.get('/:reference/confirm-update', confirmUpdate.viewConfirmUpdate())
  router.post('/:reference/confirm-update', confirmUpdate.submitConfirmUpdate())

  return router
}
