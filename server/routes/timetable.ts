import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../utils/utils'
import timetableItemBuilder from './timetableItemBuilder'

export default function routes({ visitSessionsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const today = new Date()
    const { date = '' } = req.query
    const selectedDate = getParsedDateFromQueryString(date.toString(), today)

    const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(selectedDate)

    const { prisonId } = req.session.selectedEstablishment
    const schedules = await visitSessionsService.getSessionSchedule({
      username: res.locals.user.username,
      prisonId,
      date: selectedDate,
    })

    const timetableItems = timetableItemBuilder({ schedules, selectedDate })

    res.render('pages/timetable', {
      schedules,
      timetableItems,
      selectedDate,
      weekOfDates,
      previousWeek,
      nextWeek,
    })
  })

  return router
}
