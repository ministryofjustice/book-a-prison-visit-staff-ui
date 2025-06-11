import { type RequestHandler } from 'express'
import { VisitSessionsService } from '../../services'
import { getParsedDateFromQueryString, getWeekOfDatesStartingMonday } from '../../utils/utils'
import timetableItemBuilder from '../timetableItemBuilder'

export default class TimetableController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const today = new Date()
      const { date = '' } = req.query
      const selectedDate = getParsedDateFromQueryString(date.toString(), today)

      const { weekOfDates, previousWeek, nextWeek } = getWeekOfDatesStartingMonday(selectedDate)

      const { prisonId } = req.session.selectedEstablishment
      const schedules = await this.visitSessionsService.getSessionSchedule({
        username: res.locals.user.username,
        prisonId,
        date: selectedDate,
      })

      const timetableItems = timetableItemBuilder({ schedules, selectedDate })

      return res.render('pages/timetable', {
        schedules,
        timetableItems,
        selectedDate,
        weekOfDates,
        previousWeek,
        nextWeek,
      })
    }
  }
}
