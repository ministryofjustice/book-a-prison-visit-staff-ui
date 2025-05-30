import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { clearSession } from './visitorUtils'
import { Services } from '../services'

export default function routes({ visitNotificationsService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment

    const reviewCount = (await visitNotificationsService.getNotificationCount(res.locals.user.username, prisonId)).count

    res.render('pages/index', { reviewCount })
  })

  get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
