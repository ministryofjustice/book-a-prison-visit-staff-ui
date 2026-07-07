import { Router } from 'express'
import { Services } from '../../services'
import BlockDatesOrSessionsController from './blockDatesOrSessionsController'
import BlockDateController from './blockDates/blockDateController'
import UnblockVisitDateController from './blockDates/unblockDateController'

export default function routes(services: Services): Router {
  const router = Router()

  const blockDatesOrSessionsController = new BlockDatesOrSessionsController(
    services.blockedDatesService,
    services.visitSessionsService,
  )
  const blockDateController = new BlockDateController(
    services.auditService,
    services.blockedDatesService,
    services.visitService,
  )
  const unblockDateController = new UnblockVisitDateController(services.auditService, services.blockedDatesService)

  router.get('/', blockDatesOrSessionsController.view())
  router.post('/', blockDatesOrSessionsController.validate(), blockDatesOrSessionsController.submit())

  router.get('/block-new-date', blockDateController.view())
  router.post('/block-new-date', blockDateController.validate(), blockDateController.submit())

  router.post('/unblock-date', unblockDateController.validate(), unblockDateController.submit())

  return router
}
