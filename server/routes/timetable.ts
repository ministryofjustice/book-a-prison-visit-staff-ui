import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import sessionTemplateFrequency from '../constants/sessionTemplateFrequency'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'

export default function routes(router: Router, visitSessionService: VisitSessionsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }

    const sessionDate = '2023-02-28'
    const { prisonId } = req.session.selectedEstablishment

    const schedules = await visitSessionService.getSessionSchedule({
      username: res.locals.user?.username,
      prisonId,
      sessionDate,
    })

    res.render('pages/timetable', {
      schedules,
      sessionDate,
      sessionTemplateFrequency,
    })
  })

  return router
}
