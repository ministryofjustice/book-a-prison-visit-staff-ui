import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'

export default function routes(router: Router, visitSessionService: VisitSessionsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }
    // const selectedDate = new Date()
    // const sessionDate = format(selectedDate, 'yyyy-MM-dd')
    const sessionDate = '2023-04-02'
    const { prisonId } = req.session.selectedEstablishment

    const schedules = await visitSessionService.getSessionSchedule({
      username: res.locals.user?.username,
      prisonId,
      sessionDate,
    })

    // console.log(JSON.stringify(schedules, null, 2))

    res.render('pages/timetable', {
      schedules,
      sessionDate,
    })
  })

  return router
}
