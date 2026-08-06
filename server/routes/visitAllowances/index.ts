import { Router } from 'express'
import { Services } from '../../services'
import ViewAllowancesController from './viewAllowancesController'
import UpdateAllowancesController from './updateAllowancesController'

export default function routes(services: Services): Router {
  const router = Router()

  const viewAllowancesController = new ViewAllowancesController(services.visitAllowanceService)
  const updateAllowancesController = new UpdateAllowancesController(
    services.auditService,
    services.visitAllowanceService,
  )

  router.get('/', viewAllowancesController.view())
  router.post('/', viewAllowancesController.change())

  router.get('/remand', updateAllowancesController.view())
  router.post('/remand', updateAllowancesController.validate(), updateAllowancesController.change())

  return router
}
