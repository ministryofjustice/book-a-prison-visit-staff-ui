import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler))
    )

  get(['/', '/:startDate'], async (req, res) => {
    const startDate =
      new Date(req.params?.startDate).toString() === 'Invalid Date' ? new Date() : new Date(req.params?.startDate)

    const visits = await visitSessionsService.getVisitsByDate({
      dateString: format(startDate, 'YYYY-MM-dd'),
      username: res.locals.user?.username,
    })

    const prisoner: Prisoner = await prisonerSearchService.getPrisoner(visit.prisonerId, res.locals.user?.username)

    return res.render('pages/visits/summary', { prisoner, visits })
  })

  return router
}
