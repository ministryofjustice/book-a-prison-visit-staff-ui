import { RequestHandler, Router } from 'express'
import { Services } from '../../services'
import BlockDatesOrSessionsController from './blockDatesOrSessionsController'
import BlockDateController from './blockDates/blockDateController'
import UnblockDateController from './blockDates/unblockDateController'
import ChooseDateOrSessionBlockController from './chooseDateOrSessionBlockController'
import config from '../../config'
import BlockSessionChooseController from './blockSessions/blockSessionChooseController'

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

  // Block visit dates or sessions main page with listing
  router.get(
    '/',
    config.features.sessionDateBlocks
      ? blockDatesOrSessionsController.view()
      : blockDatesOrSessionsController.viewDateBlocksOnly(),
  )
  router.post('/', blockDatesOrSessionsController.validate(), blockDatesOrSessionsController.submit())

  // Choose whether to block a date or a session
  router.get('/block-date-or-session', checkSessionDataMiddleware, chooseDateOrSessionBlockController.view())
  router.post(
    '/block-date-or-session',
    checkSessionDataMiddleware,
    chooseDateOrSessionBlockController.validate(),
    chooseDateOrSessionBlockController.submit(),
  )

  // Date block pages
  router.get('/block-new-date', checkSessionDataMiddleware, blockDateController.view())
  router.post(
    '/block-new-date',
    checkSessionDataMiddleware,
    blockDateController.validate(),
    blockDateController.submit(),
  )

  // Unblock date
  router.post('/unblock-date', unblockDateController.validate(), unblockDateController.submit())

  // Session block - choose session page
  router.get('/block-new-session/choose', checkSessionDataMiddleware, blockSessionChooseController.view())
  router.post(
    '/block-new-session/choose',
    checkSessionDataMiddleware,
    blockSessionChooseController.validate(),
    blockSessionChooseController.submit(),
  )

  // Unblock session
  router.post('/unblock-session', (req, res) => res.redirect('/block-visit-dates')) // TODO implement unblock session functionality

  return router
}

// Middleware to ensure route has required session data
const checkSessionDataMiddleware: RequestHandler = (req, res, next) => {
  if (!req.session.blockDateOrSession) {
    return res.redirect('/block-visit-dates')
  }
  return next()
}
