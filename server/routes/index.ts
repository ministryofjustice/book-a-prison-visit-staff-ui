import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'
import { Prison } from '../@types/bapv'
import config from '../config'

export default function routes({ visitNotificationsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const prison = req.session.selectedEstablishment
    const { username } = res.locals.user

    const showRequestedVisitsTile = config.features.visitRequest && isPrisonEnabledForPublic(prison)
    const requestCount = showRequestedVisitsTile
      ? (await visitNotificationsService.getVisitRequestCount(username, prison.prisonId)).count
      : null

    const reviewCount = (await visitNotificationsService.getNotificationCount(username, prison.prisonId)).count
    res.render('pages/index', { showRequestedVisitsTile, requestCount, reviewCount })
  })

  router.get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}

function isPrisonEnabledForPublic(prison: Prison): boolean {
  return prison.clients.some(client => client.userType === 'PUBLIC' && client.active)
}
