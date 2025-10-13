import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import BookerSearchController from './bookerSearchController'
import BookerDetailsController from './bookerDetailsController'
import bapvUserRoles from '../../constants/bapvUserRoles'
import config from '../../config'
import { isValidBookerReference } from '../validationChecks'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerSearchController = new BookerSearchController(services.auditService, services.bookerService)
  const bookerDetailsController = new BookerDetailsController(services.auditService, services.bookerService)

  // Restrict booker management routes by role
  router.use((req, res, next) => {
    if (res.locals.user.userRoles.includes(bapvUserRoles.BOOKER_ADMIN) || config.features.bookerManagement.enabled) {
      return next()
    }
    return res.redirect('/authError')
  })

  // Booker search
  router.get('/search', bookerSearchController.view())
  router.post('/search', bookerSearchController.validate(), bookerSearchController.search())

  // TODO HERE select booker account routes
  router.get('/select-account', (req, res) => res.send('<html><body><h1>Select booker account</h1></body></html>'))

  // middleware to ensure valid booker reference for all /manage-bookers/:reference routes
  router.use('/:reference', (req, res, next) => {
    const { reference } = req.params
    if (!isValidBookerReference(reference)) {
      throw new BadRequest()
    }
    next()
  })

  // Booker details
  router.get('/:reference/booker-details', bookerDetailsController.view())

  return router
}
