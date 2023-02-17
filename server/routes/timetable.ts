import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import { NotFound } from 'http-errors'
import logger from '../../logger'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import VisitSessionsService from '../services/visitSessionsService'

export default function routes(router: Router, visitSessionService: VisitSessionsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }
    const selectedDate = new Date()
    const sessionDate = format(selectedDate, 'yyyy-MM-dd')

    const prisonId = 'HEI'

    const visitSchedule = visitSessionService.getVisitSchedule({
      username: res.locals.user?.username,
      prisonId,
      sessionDate,
    })
    logger.info('.....')
    console.log(visitSchedule)
    logger.info('.....')
    res.render('pages/timetable', {
      visitSchedule,
    })
  })

  return router
}
