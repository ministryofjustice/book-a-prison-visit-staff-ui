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
    const { showReviewBookingsTile } = config.features

    const reviewCount = showReviewBookingsTile
      ? (await visitService.getNotificationCount(res.locals.user.username, prisonId)).count
      : undefined

    res.render('pages/index', {
      hidePhaseBanner: true,
      showEstablishmentSwitcher: true,
      showReviewBookingsTile,
      reviewCount,
    })
  })

  get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
