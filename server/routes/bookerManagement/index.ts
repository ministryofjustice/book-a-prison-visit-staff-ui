import { Router } from 'express'
import { Services } from '../../services'
import ManageBookersController from './manageBookersController'
import bapvUserRoles from '../../constants/bapvUserRoles'
import SelectBookerAccountController from './selectBookerAccountController'
import bookerRoutes from './booker'
import visitorRequestRoutes from './visitorRequests'

export default function routes(services: Services): Router {
  const router = Router()

  const manageBookersController = new ManageBookersController(services.auditService, services.bookerService)
  const selectBookerAccountController = new SelectBookerAccountController(services.bookerService)

  // Restrict booker management routes by role
  router.use((req, res, next) => {
    if (res.locals.user.userRoles.includes(bapvUserRoles.BOOKER_ADMIN)) {
      return next()
    }
    return res.redirect('/authError')
  })

  // Booker management (search and visitor requests)
  router.get('/', manageBookersController.view())
  router.post('/', manageBookersController.validate(), manageBookersController.search())

  router.get('/select-account', selectBookerAccountController.view())
  router.post(
    '/select-account',
    selectBookerAccountController.validate(),
    selectBookerAccountController.selectAccount(),
  )

  router.use('/visitor-request', visitorRequestRoutes(services))
  router.use('/', bookerRoutes(services))

  return router
}
