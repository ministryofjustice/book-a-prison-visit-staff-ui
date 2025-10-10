import { Router } from 'express'
import { Services } from '../../services'
import BookerSearchController from './bookerSearchController'
import bapvUserRoles from '../../constants/bapvUserRoles'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerSearchController = new BookerSearchController(services.auditService, services.bookerService)

  // Restrict booker management routes by role
  router.use((req, res, next) => {
    if (res.locals.user.userRoles.includes(bapvUserRoles.BOOKER_ADMIN) || config.features.bookerManagement.enabled) {
      return next()
    }
    return res.redirect('/authError')
  })

  router.get('/search', bookerSearchController.view())
  router.post('/search', bookerSearchController.validate(), bookerSearchController.search())

  return router
}
