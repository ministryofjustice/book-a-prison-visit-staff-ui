import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { clearSession } from './visitorUtils'
import config from '../config'

export default function routes(): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (_req, res) => {
    res.render('pages/index', {
      hidePhaseBanner: true,
      showEstablishmentSwitcher: true,
      showReviewBookingsTile: config.features.showReviewBookingsTile,
      // todo - needs test coverage for 0, X, 99+
      reviewCount: 10,
    })
  })

  get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
