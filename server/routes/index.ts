import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'
import bapvUserRoles from '../constants/bapvUserRoles'
import config from '../config'

export default function routes({ bookerService, visitNotificationsService, visitRequestsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const prison = res.locals.selectedEstablishment
    const isPrisonEnabledForPublic = prison.publicClient?.active ?? false
    const { userRoles } = res.locals.user

    // Requested visits tile and count (public-enabled prisons only)
    const showRequestedVisitsTile = isPrisonEnabledForPublic
    const visitRequestCount = showRequestedVisitsTile
      ? await visitRequestsService.getVisitRequestCount(prison.prisonId)
      : null

    // Visits needing review count (all prisons)
    const visitReviewCount = await visitNotificationsService.getNotificationCount(prison.prisonId)

    // Manage online bookers tile (users with ADMIN role) and visitor requests count (pubic-enabled prisons only)
    const showBookerManagementTile = userRoles.includes(bapvUserRoles.BOOKER_ADMIN)
    const visitorRequestCount =
      showBookerManagementTile && isPrisonEnabledForPublic
        ? await bookerService.getVisitorRequestCount({ prisonId: prison.prisonId })
        : 0

    const showVisitAllowanceTile = config.features.remandLimits

    res.render('pages/index', {
      showRequestedVisitsTile,
      visitRequestCount,
      visitReviewCount,
      showBookerManagementTile,
      showVisitAllowanceTile,
      visitorRequestCount,
    })
  })

  router.get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
