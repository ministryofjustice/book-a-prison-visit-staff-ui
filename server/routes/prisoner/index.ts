import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { PrisonerBasePermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../../services'
import VisitOrdersHistoryController from './visitOrders/visitOrdersHistoryController'
import { isValidPrisonerNumber } from '../validationChecks'
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
  router
    .route('/:prisonerId')
    // Check user's permissions for this prisoner for the profile view
    .all(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerBasePermission.read],
        getPrisonerNumberFunction: req => req.params.prisonerId as string,
      }),
    )
    .get(prisonerProfileController.view())
    .post(prisonerProfileController.submit())

  // Visiting orders
  router.get('/:prisonerId/edit-visiting-orders-balances', editVisitOrdersBalancesController.view())
  router.post(
    '/:prisonerId/edit-visiting-orders-balances',
    editVisitOrdersBalancesController.validate(),
    editVisitOrdersBalancesController.submit(),
  )

  router.get('/:prisonerId/visiting-orders-history', visitOrdersHistoryController.view())

  return router
}
