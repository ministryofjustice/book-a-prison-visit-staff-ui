import { Router } from 'express'
import { Services } from '../../services'
import TimetableController from './timetableController'

export default function routes(services: Services): Router {
  const router = Router()

  const timetableController = new TimetableController(services.visitSessionsService)

  router.get('/', timetableController.view())

  return router
}
