import { Router } from 'express'
import { Services } from '../../services'
import BlockVisitDatesController from './blockVisitDatesController'
import BlockNewDateController from './blockNewDateController'
import UnblockVisitDateController from './unblockVisitDateController'

export default function routes(services: Services): Router {
  const router = Router()

  const blockVisitDatesController = new BlockVisitDatesController(services.blockedDatesService)
  const blockNewDateController = new BlockNewDateController(
    services.auditService,
    services.blockedDatesService,
    services.visitService,
  )
  const unblockVisitDateController = new UnblockVisitDateController(services.auditService, services.blockedDatesService)

  router.get('/', blockVisitDatesController.view())
  router.post('/', blockVisitDatesController.validate(), blockVisitDatesController.submit())

  router.get('/block-new-date', blockNewDateController.view())
  router.post('/block-new-date', blockNewDateController.validate(), blockNewDateController.submit())

  router.post('/unblock-date', unblockVisitDateController.validate(), unblockVisitDateController.submit())

  return router
}
