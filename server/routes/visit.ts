import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { isValidVisitReference } from './validationChecks'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:reference', async (req, res) => {
    const { reference } = req.params

    if (!isValidVisitReference(reference)) {
      throw new BadRequest()
    }

    const { visit, visitors } = await visitSessionsService.getFullVisitDetails({
      reference,
      username: res.locals.user?.username,
    })

    const prisoner: Prisoner = await prisonerSearchService.getPrisoner(visit.prisonerId, res.locals.user?.username)

    return res.render('pages/visit/summary', { prisoner, visit, visitors })
  })

  return router
}
