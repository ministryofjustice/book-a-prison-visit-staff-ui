import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { clearSession } from './visitorUtils'

export default function routes(): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (_req, res) => {
    res.render('pages/index', {
      hidePhaseBanner: true,
      showEstablishmentSwitcher: true,
    })
  })

  get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
