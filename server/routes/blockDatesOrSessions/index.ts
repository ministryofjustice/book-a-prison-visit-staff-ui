import { Router } from 'express'
import { Services } from '../../services'
import BlockDatesOrSessionsController from './blockDatesOrSessionsController'
import BlockDateController from './blockDates/blockDateController'
import UnblockDateController from './blockDates/unblockDateController'
import ChooseDateOrSessionBlockController from './chooseDateOrSessionBlockController'
import config from '../../config'

export default function routes(services: Services): Router {
  const router = Router()

  const blockDatesOrSessionsController = new BlockDatesOrSessionsController(
    services.blockDatesOrSessionsService,
    services.visitSessionsService,
  )

  const chooseDateOrSessionBlockController = new ChooseDateOrSessionBlockController(
    services.auditService,
    services.blockDatesOrSessionsService,
  )

  const blockDateController = new BlockDateController(
    services.auditService,
    services.blockDatesOrSessionsService,
    services.visitService,
  )

  const unblockDateController = new UnblockDateController(services.auditService, services.blockDatesOrSessionsService)

  // Block visit dates or sessions main page with listing
  router.get(
    '/',
    config.features.sessionDateBlocks
      ? blockDatesOrSessionsController.view()
      : blockDatesOrSessionsController.viewDateBlocksOnly(),
  )
  router.post('/', blockDatesOrSessionsController.validate(), blockDatesOrSessionsController.submit())

  // Choose whether to block a date or a session
  router.get('/block-date-or-session', chooseDateOrSessionBlockController.view())

  // Date block pages
  router.get('/block-new-date', blockDateController.view())
  router.post('/block-new-date', blockDateController.validate(), blockDateController.submit())

  router.post('/unblock-date', unblockDateController.validate(), unblockDateController.submit())

  return router
}
