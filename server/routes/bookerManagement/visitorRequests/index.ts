import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../../services'
import { isValidVisitorRequestReference } from '../../validationChecks'
import VisitorRequestDetailsController from './visitorRequestDetailsController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitorRequestDetailsController = new VisitorRequestDetailsController(
    services.auditService,
    services.bookerService,
  )

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

  return router
}
