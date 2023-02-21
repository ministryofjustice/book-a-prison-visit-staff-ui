import { isMonday, previousMonday } from 'date-fns'
import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../utils/utils'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }

    const today = new Date()
    const defaultDate = isMonday(today) ? today : previousMonday(today)

    const { date = '' } = req.query
    const selectedDate = getParsedDateFromQueryString(date.toString(), defaultDate)

    const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(selectedDate)

    res.render('pages/timetable', {
      selectedDate,
      weekOfDates,
      previousWeek,
      nextWeek,
    })
  })

  return router
}
