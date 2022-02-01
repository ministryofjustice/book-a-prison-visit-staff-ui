import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import isValidPrisonerNumber from './prisonerProfileValidation' // @TODO move validation now it's shared?

export default function routes(router: Router, prisonerVisitorsService: PrisonerVisitorsService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerVisitors = await prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)
    res.render('pages/visitors', { ...prisonerVisitors })
  })

  return router
}
