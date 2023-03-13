import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import sessionTemplateFrequency from '../constants/sessionTemplateFrequency'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../utils/utils'

export default function routes(router: Router, services: Services): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }

    const today = new Date()
    const { date = '' } = req.query
    const selectedDate = getParsedDateFromQueryString(date.toString(), today)

    const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(selectedDate)

    const { prisonId } = req.session.selectedEstablishment
    const schedules = await services.visitSessionsService.getSessionSchedule({
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
