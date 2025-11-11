import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import BookerSearchController from './bookerSearchController'
import BookerDetailsController from './bookerDetailsController'
import bapvUserRoles from '../../constants/bapvUserRoles'
import { isValidBookerReference } from '../validationChecks'
import SelectBookerAccountController from './selectBookerAccountController'
import BookerUnlinkVisitorController from './bookerUnlinkVisitorController'
import BookerLinkVisitorListController from './bookerLinkVisitorList'
import BookerLinkVisitorController from './bookerLinkVisitor'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerSearchController = new BookerSearchController(services.auditService, services.bookerService)
  const bookerDetailsController = new BookerDetailsController(services.auditService, services.bookerService)
  const selectBookerAccountController = new SelectBookerAccountController(services.bookerService)
  const bookerLinkVisitorListController = new BookerLinkVisitorListController(services.bookerService)
  const bookerLinkVisitorController = new BookerLinkVisitorController(services.auditService, services.bookerService)
  const bookerUnlinkVisitorController = new BookerUnlinkVisitorController(services.auditService, services.bookerService)

  // Restrict booker management routes by role
  router.use((req, res, next) => {
    if (res.locals.user.userRoles.includes(bapvUserRoles.BOOKER_ADMIN)) {
      return next()
    }
    return res.redirect('/authError')
  })

  // Booker search
  router.get('/search', bookerSearchController.view())
  router.post('/search', bookerSearchController.validate(), bookerSearchController.search())

  router.get('/select-account', selectBookerAccountController.view())
  router.post(
    '/select-account',
    selectBookerAccountController.validate(),
    selectBookerAccountController.selectAccount(),
  )

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

  // Link visitor
  router.get('/:reference/prisoner/:prisonerId/link-visitor', bookerLinkVisitorListController.view()) // TODO add validation handler
  router.post('/:reference/prisoner/:prisonerId/link-visitor', bookerLinkVisitorListController.submit()) // TODO add validation handler
  router.get('/:reference/prisoner/:prisonerId/link-visitor/:visitorId/notify', bookerLinkVisitorController.view()) // TODO add validation handler
  router.post('/:reference/prisoner/:prisonerId/link-visitor/:visitorId', bookerLinkVisitorController.submit()) // TODO add validation handler

  // Unlink visitor
  router.post(
    '/:reference/prisoner/:prisonerId/visitor/:visitorId/unlink',
    bookerUnlinkVisitorController.validate(),
    bookerUnlinkVisitorController.unlink(),
  )

  return router
}
