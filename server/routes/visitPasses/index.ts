import { Router } from 'express'
import { Services } from '../../services'
import VisitPassesController from './visitPassesController'

export default function routes(services: Services): Router {
  const router = Router()
  const visitPassesController = new VisitPassesController(services.auditService, services.visitService)

  router.get('/', visitPassesController.viewByDate())

  return router
}
