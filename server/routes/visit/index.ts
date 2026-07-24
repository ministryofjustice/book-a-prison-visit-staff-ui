import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import VisitDetailsController from './details/visitDetailsController'
import CancelVisitController from './cancel/cancelVisitController'
import { isValidVisitReference } from '../validationChecks'
import ClearNotificationsController from './clearNotifications/clearNotificationsController'
import ConfirmUpdateController from './update/confirmUpdateController'
import UpdateVisitController from './update/updateVisitController'
import ProcessVisitRequestController from './visitRequests/processVisitRequestController'
import VisitPassesController from '../visitPasses/visitPassesController'
import VisitRequestRejectionReasonController from './visitRequests/visitRequestRejectionReasonController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitDetails = new VisitDetailsController(services.auditService, services.visitService)
  const cancelVisit = new CancelVisitController(services.auditService, services.visitService)
  const clearNotifications = new ClearNotificationsController(services.auditService, services.visitNotificationsService)
  const confirmUpdate = new ConfirmUpdateController()
  const updateVisit = new UpdateVisitController(services.visitService)
  const processVisitRequest = new ProcessVisitRequestController(
    services.auditService,
    services.visitRequestsService,
    services.visitService,
  )
  const visitRequestRejectionReason = new VisitRequestRejectionReasonController()
  const visitPassesController = new VisitPassesController(services.auditService, services.visitService)

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

  router.get('/:reference/visit-pass', visitPassesController.viewByVisit())

  router.get('/:reference/confirm-update', confirmUpdate.viewConfirmUpdate())
  router.post('/:reference/confirm-update', confirmUpdate.submitConfirmUpdate())

  router.post('/:reference/request/approve', processVisitRequest.processRequest('approve'))
  router.get('/:reference/request/reject/reason', visitRequestRejectionReason.view())
  router.post(
    '/:reference/request/reject',
    processVisitRequest.validate(),
    processVisitRequest.processRequest('reject'),
  )

  return router
}
