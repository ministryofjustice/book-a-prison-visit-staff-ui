import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import BookerSearchController from './bookerSearchController'
import BookerDetailsController from './bookerDetailsController'
import bapvUserRoles from '../../constants/bapvUserRoles'
import { isValidBookerReference } from '../validationChecks'
import SelectBookerAccountController from './selectBookerAccountController'
import UnlinkVisitorController from './unlinkVisitorController'
import ApprovedVisitorListController from './approvedVisitorListController'
import LinkVisitorController from './linkVisitorController'

export default function routes(services: Services): Router {
  const router = Router()

  const bookerSearchController = new BookerSearchController(services.auditService, services.bookerService)
  const bookerDetailsController = new BookerDetailsController(services.auditService, services.bookerService)
  const selectBookerAccountController = new SelectBookerAccountController(services.bookerService)
  const approvedVisitorListController = new ApprovedVisitorListController(services.bookerService)
  const linkVisitorController = new LinkVisitorController(services.auditService, services.bookerService)
  const unlinkVisitorController = new UnlinkVisitorController(services.auditService, services.bookerService)

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

  // Link visitor - approved visitor list
  router.get('/:reference/prisoner/:prisonerId/link-visitor', approvedVisitorListController.view())
  router.post(
    '/:reference/prisoner/:prisonerId/link-visitor',
    approvedVisitorListController.validate(),
    approvedVisitorListController.submit(),
  )

  // Link visitor - confirm and notify
  router.get(
    '/:reference/prisoner/:prisonerId/link-visitor/:visitorId/notify',
    linkVisitorController.validateView(),
    linkVisitorController.view(),
  )
  router.post(
    '/:reference/prisoner/:prisonerId/link-visitor/:visitorId/notify',
    linkVisitorController.validateSubmit(),
    linkVisitorController.submit(),
  )

  // Unlink visitor
  router.post(
    '/:reference/prisoner/:prisonerId/visitor/:visitorId/unlink',
    unlinkVisitorController.validate(),
    unlinkVisitorController.unlink(),
  )

  return router
}
