import { RequestHandler, Router } from 'express'
import { Services } from '../../services'
import BlockDatesOrSessionsController from './blockDatesOrSessionsController'
import BlockDateController from './blockDates/blockDateController'
import UnblockDateController from './blockDates/unblockDateController'
import ChooseDateOrSessionBlockController from './chooseDateOrSessionBlockController'
import BlockSessionChooseController from './blockSessions/blockSessionChooseController'
import BlockSessionConfirmController from './blockSessions/blockSessionConfirmController'
import UnblockSessionController from './blockSessions/unblockSessionController'

export default function routes(services: Services): Router {
  const router = Router()

  const blockDatesOrSessionsController = new BlockDatesOrSessionsController(
    services.blockDatesOrSessionsService,
    services.visitSessionsService,
  )

  const chooseDateOrSessionBlockController = new ChooseDateOrSessionBlockController()

  const blockDateController = new BlockDateController(
    services.auditService,
    services.blockDatesOrSessionsService,
    services.visitService,
  )
  const unblockDateController = new UnblockDateController(services.auditService, services.blockDatesOrSessionsService)

  const blockSessionChooseController = new BlockSessionChooseController(services.visitSessionsService)

  const blockSessionConfirmController = new BlockSessionConfirmController(
    services.auditService,
    services.blockDatesOrSessionsService,
    services.visitService,
  )

  const unblockSessionController = new UnblockSessionController(
    services.auditService,
    services.blockDatesOrSessionsService,
    services.visitSessionsService,
  )

  // Middlewares to ensure route has required session data
  const checkSessionDataMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session.blockDateOrSession) {
      return res.redirect('/block-visit-dates-or-sessions')
    }
    return next()
  }
  const checkSelectedSessionMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session.blockDateOrSession?.selectedSession) {
      return res.redirect('/block-visit-dates-or-sessions')
    }
    return next()
  }

  // Block visit dates or sessions main page with listing
  router
    .route('/')
    .get(blockDatesOrSessionsController.view())
    .post(blockDatesOrSessionsController.validate(), blockDatesOrSessionsController.submit())

  // Choose whether to block a date or a session
  router
    .route('/block-date-or-session')
    .all(checkSessionDataMiddleware)
    .get(chooseDateOrSessionBlockController.view())
    .post(chooseDateOrSessionBlockController.validate(), chooseDateOrSessionBlockController.submit())

  // Date block pages
  router
    .route('/block-new-date')
    .all(checkSessionDataMiddleware)
    .get(blockDateController.view())
    .post(blockDateController.validate(), blockDateController.submit())

  // Unblock date
  router.post('/unblock-date', unblockDateController.validate(), unblockDateController.submit())

  // Session block - choose session page
  router
    .route('/block-new-session/choose')
    .all(checkSessionDataMiddleware)
    .get(blockSessionChooseController.view())
    .post(blockSessionChooseController.validate(), blockSessionChooseController.submit())

  // Session block - confirm session page
  router
    .route('/block-new-session/confirm')
    .all(checkSessionDataMiddleware, checkSelectedSessionMiddleware)
    .get(blockSessionConfirmController.view())
    .post(blockSessionConfirmController.validate(), blockSessionConfirmController.submit())

  // Unblock session
  router.post('/unblock-session', unblockSessionController.validate(), unblockSessionController.submit())

  return router
}
