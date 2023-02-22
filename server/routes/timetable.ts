import { isMonday, previousMonday } from 'date-fns'
import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import sessionTemplateFrequency from '../constants/sessionTemplateFrequency'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../utils/utils'

export default function routes(router: Router, visitSessionService: VisitSessionsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }

    const today = new Date()
    const defaultDate = isMonday(today) ? today : previousMonday(today)

    const { date = '' } = req.query
    const sessionDate = getParsedDateFromQueryString(date.toString(), defaultDate)
    const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(sessionDate)

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
      weekOfDates,
      previousWeek,
      nextWeek,
    })
  })

  return router
}
