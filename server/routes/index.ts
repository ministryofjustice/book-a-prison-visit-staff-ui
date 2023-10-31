import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { clearSession } from './visitorUtils'
import config from '../config'
import { Services } from '../services'

export default function routes({ visitService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment
    const reviewCount = await visitService.getNotificationCount(res.locals.user.username, prisonId)

    res.render('pages/index', {
      hidePhaseBanner: true,
      showEstablishmentSwitcher: true,
      showReviewBookingsTile: config.features.showReviewBookingsTile,
      reviewCount: reviewCount.count,
    })
  })

  get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
