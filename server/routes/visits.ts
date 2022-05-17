import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import config from '../config'
import { VisitInformation, PrisonerDetailsItem } from '../@types/bapv'
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

    const visits: VisitInformation[] = await visitSessionsService.getVisitsByDate({
      dateString: format(startDate, 'yyyy-MM-dd'),
      username: res.locals.user?.username,
    })
    const everyVisitPrisoner = visits.map(visit => visit.prisonNumber)
    const prisoners = [...new Set(everyVisitPrisoner)]
    const search = (req.query.search || '') as string
    const currentPage = (req.query.page || '') as string
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch

    let results: PrisonerDetailsItem[][] = []
    let numberOfResults = 0
    let next
    let previous

    if (prisoners.length > 0) {
      ;({ results, numberOfResults, next, previous } = await prisonerSearchService.getPrisonersByPrisonerNumbers(
        prisoners,
        res.locals.user?.username,
        parsedPage
      ))
    }
    const realNumberOfResults = numberOfResults
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    // const pageLinks = getResultsPagingLinks({
    //   pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
    //   numberOfPages,
    //   currentPage: parsedPage,
    //   searchParam: `search=${search}`,
    //   searchUrl: '/',
    // })

    return res.render('pages/visits/summary', {
      search,
      results,
      next,
      previous,
      numberOfResults: realNumberOfResults,
      pageSize,
      from: (parsedPage - 1) * pageSize + 1,
      to,
      //   pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  return router
}
