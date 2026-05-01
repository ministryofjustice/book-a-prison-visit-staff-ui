import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../../services'
import BookerDetailsController from './bookerDetailsController'
import { isValidBookerReference } from '../../validationChecks'
import UnlinkVisitorController from './unlinkVisitorController'
import VisitorListController from './visitorListController'
import LinkVisitorController from './linkVisitorController'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerDetailsController = new BookerDetailsController(services.auditService, services.bookerService)
  const visitorListController = new VisitorListController(services.bookerService)
  const linkVisitorController = new LinkVisitorController(services.auditService, services.bookerService)
  const unlinkVisitorController = new UnlinkVisitorController(services.auditService, services.bookerService)

  // middleware to ensure valid booker reference for all /manage-bookers/:reference routes
  router.use('/:reference', (req, res, next) => {
    const { reference } = req.params
    if (!isValidBookerReference(reference)) {
      throw new BadRequest()
    }
    next()
  })

  // Booker details
  router.get('/:reference/booker-details', bookerDetailsController.view())

  // Link visitor - visitor list
  router.get('/:reference/prisoner/:prisonerId/link-visitor', visitorListController.view())
  router.post(
    '/:reference/prisoner/:prisonerId/link-visitor',
    visitorListController.validate(),
    visitorListController.submit(),
  )

  // Link visitor - confirm and notify
  router.get(
    '/:reference/prisoner/:prisonerId/link-visitor/:visitorId/notify',
    linkVisitorController.validateView(),
    linkVisitorController.view(),
  )
  router.post(
    '/:reference/prisoner/:prisonerId/link-visitor/:visitorId/notify',
    linkVisitorController.validateSubmit(),
    linkVisitorController.submit(),
  )

  // Unlink visitor
  router.post(
    '/:reference/prisoner/:prisonerId/visitor/:visitorId/unlink',
    unlinkVisitorController.validate(),
    unlinkVisitorController.unlink(),
  )

  return router
}
