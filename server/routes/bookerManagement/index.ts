import { Router } from 'express'
import { Services } from '../../services'
import BookerSearchController from './bookerSearchController'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'
import bapvUserRoles from '../../constants/bapvUserRoles'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerSearchController = new BookerSearchController(services.bookerService)

  // Restrict booker management routes by role
  if (!config.features.bookerManagement.enabled) {
    router.use(authorisationMiddleware([bapvUserRoles.BOOKER_ADMIN]))
  }

  router.get('/search', bookerSearchController.view())
  router.post('/search', bookerSearchController.validate(), bookerSearchController.search())

  return router
}
