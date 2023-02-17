import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    if (!config.features.viewTimetableEnabled) {
      throw new NotFound()
    }

    res.render('pages/timetable')
  })

  return router
}
