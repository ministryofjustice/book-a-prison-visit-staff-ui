import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../../services'
import { isValidVisitorRequestReference } from '../../validationChecks'
import VisitorRequestDetailsController from './visitorRequestDetailsController'
import CheckLinkedVisitorsController from './checkLinkedVisitorsController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitorRequestDetailsController = new VisitorRequestDetailsController(
    services.auditService,
    services.bookerService,
  )
  const checkLinkedVisitorsController = new CheckLinkedVisitorsController(services.auditService, services.bookerService)

  // middleware to ensure valid visitor request reference
  // for all /manage-bookers/visitor-request/:requestReference routes
  router.use('/:requestReference', (req, res, next) => {
    const { requestReference } = req.params
    if (!isValidVisitorRequestReference(requestReference)) {
      throw new BadRequest()
    }
    next()
  })

  // Visitor request - link a visitor
  router.get('/:requestReference/link-visitor', visitorRequestDetailsController.view())
  router.post(
    '/:requestReference/link-visitor',
    visitorRequestDetailsController.validate(),
    visitorRequestDetailsController.submit(),
  )

  // Visitor request - check linked visitors
  router.get('/:requestReference/check-linked-visitors', checkLinkedVisitorsController.view())
  router.post(
    '/:requestReference/check-linked-visitors',
    checkLinkedVisitorsController.validate(),
    checkLinkedVisitorsController.submit(),
  )

  return router
}
