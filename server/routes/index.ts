import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'
import bapvUserRoles from '../constants/bapvUserRoles'

export default function routes({ visitNotificationsService, visitRequestsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const prison = req.session.selectedEstablishment
    const { username, userRoles } = res.locals.user

    const showRequestedVisitsTile = prison.isEnabledForPublic
    const requestCount = showRequestedVisitsTile
      ? (await visitRequestsService.getVisitRequestCount(username, prison.prisonId)).count
      : null

    const reviewCount = (await visitNotificationsService.getNotificationCount(username, prison.prisonId)).count

    const showBookerManagementTile = userRoles.includes(bapvUserRoles.BOOKER_ADMIN)

    res.render('pages/index', { showRequestedVisitsTile, requestCount, reviewCount, showBookerManagementTile })
  })

  router.get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
