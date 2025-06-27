import { Router } from 'express'

import { clearSession } from './visitorUtils'
import { Services } from '../services'

export default function routes({ visitNotificationsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment

    const reviewCount = (await visitNotificationsService.getNotificationCount(res.locals.user.username, prisonId)).count

    res.render('pages/index', { reviewCount })
  })

  router.get('/back-to-start', (req, res) => {
    clearSession(req)
    res.redirect('/')
  })

  return router
}
