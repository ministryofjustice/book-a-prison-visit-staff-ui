import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'
import bapvUserRoles from '../constants/bapvUserRoles'

export default function routes({ bookerService, visitNotificationsService, visitRequestsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const prison = req.session.selectedEstablishment
    const { username, userRoles } = res.locals.user

    // Requested visits tile and count (public-enabled prisons only)
    const showRequestedVisitsTile = prison.isEnabledForPublic
    const visitRequestCount = showRequestedVisitsTile
      ? await visitRequestsService.getVisitRequestCount(username, prison.prisonId)
      : null

    // Visits needing review count (all prisons)
    const visitReviewCount = await visitNotificationsService.getNotificationCount(username, prison.prisonId)

    // Manage online bookers tile (users with ADMIN role) and visitor requests count (pubic-enabled prisons only)
    const showBookerManagementTile = userRoles.includes(bapvUserRoles.BOOKER_ADMIN)
    const visitorRequestCount =
      showBookerManagementTile && prison.isEnabledForPublic
        ? await bookerService.getVisitorRequestCount({ username, prisonId: prison.prisonId })
        : 0

    res.render('pages/index', {
      showRequestedVisitsTile,
      visitRequestCount,
      visitReviewCount,
      showBookerManagementTile,
      visitorRequestCount,
    })
  })

  router.get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
