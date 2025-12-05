import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'
import bapvUserRoles from '../constants/bapvUserRoles'
import config from '../config'

export default function routes({ bookerService, visitNotificationsService, visitRequestsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const prison = req.session.selectedEstablishment
    const { username, userRoles } = res.locals.user

    // Requested visits tile and count
    const showRequestedVisitsTile = prison.isEnabledForPublic
    const visitRequestCount = showRequestedVisitsTile
      ? (await visitRequestsService.getVisitRequestCount(username, prison.prisonId)).count
      : null

    // Visits needing review count
    const visitReviewCount = (await visitNotificationsService.getNotificationCount(username, prison.prisonId)).count

    // Manage online bookers tile and visitor requests count
    const showBookerManagementTile = userRoles.includes(bapvUserRoles.BOOKER_ADMIN)
    const visitorRequestCount =
      showBookerManagementTile && config.features.visitorRequests.enabled
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
