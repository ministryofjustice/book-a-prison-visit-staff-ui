import { Router } from 'express'
import { Services } from '../../services'
import VisitPassesController from './visitPassesController'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  if (config.features.printVisitPasses) {
    const visitPassesController = new VisitPassesController(services.auditService, services.visitService)

    router.get('/', visitPassesController.viewByDate())
  }

  return router
}
