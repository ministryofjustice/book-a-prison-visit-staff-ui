import type { RequestHandler, Router } from 'express'
import sessionTemplateFrequency from '../constants/sessionTemplateFrequency'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../utils/utils'

export default function routes(router: Router, visitSessionService: VisitSessionsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const today = new Date()
    const { date = '' } = req.query
    const selectedDate = getParsedDateFromQueryString(date.toString(), today)

    const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(selectedDate)

    const { prisonId } = req.session.selectedEstablishment
    const schedules = await visitSessionService.getSessionSchedule({
      username: res.locals.user?.username,
      prisonId,
      date: selectedDate,
    })

    res.render('pages/timetable', {
      schedules,
      selectedDate,
      sessionTemplateFrequency,
      weekOfDates,
      previousWeek,
      nextWeek,
    })
  })

  return router
}
