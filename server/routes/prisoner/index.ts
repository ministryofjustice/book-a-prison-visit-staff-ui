import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Services } from '../../services'
import VisitOrdersHistoryController from './visitOrders/visitOrdersHistoryController'
import { isValidPrisonerNumber } from '../validationChecks'
import config from '../../config'
import PrisonerProfileController from './prisonerProfileController'
import EditVisitOrdersBalancesController from './visitOrders/editVisitOrdersBalancesController'

export default function routes(services: Services): Router {
  const router = Router()

  const prisonerProfileController = new PrisonerProfileController(
    services.auditService,
    services.prisonerProfileService,
  )
  const editVisitOrdersBalancesController = new EditVisitOrdersBalancesController(
    services.auditService,
    services.visitOrdersService,
  )
  const visitOrdersHistoryController = new VisitOrdersHistoryController(services.visitOrdersService)

  // middleware to ensure valid prisoner ID for all /prisoner routes
  router.use('/:prisonerId', (req, res, next) => {
    const { prisonerId } = req.params
    if (!isValidPrisonerNumber(prisonerId)) {
      throw new BadRequest()
    }
    next()
  })

  // Prisoner profile
  router.get('/:prisonerId', prisonerProfileController.view())
  router.post('/:prisonerId', prisonerProfileController.submit())

  // Visiting orders
  if (config.features.voAdjustment.enabled) {
    router.get('/:prisonerId/edit-visiting-orders-balances', editVisitOrdersBalancesController.view())
  }
  if (config.features.voHistory.enabled) {
    router.get('/:prisonerId/visiting-orders-history', visitOrdersHistoryController.view())
  }

  return router
}
