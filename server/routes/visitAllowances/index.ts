import { Router } from 'express'
import { Services } from '../../services'
import ViewAllowancesController from './viewAllowancesController'

export default function routes(services: Services): Router {
  const router = Router()

  const viewAllowancesController = new ViewAllowancesController(services.visitAllowanceService)

  router.get('/', viewAllowancesController.view())
  router.post('/', viewAllowancesController.change())

  return router
}
