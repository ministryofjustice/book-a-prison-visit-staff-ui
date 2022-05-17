import type { RequestHandler, Router } from 'express'
import { format } from 'date-fns'
import config from '../config'
import { VisitInformation, PrisonerDetailsItem } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { getResultsPagingLinks } from '../utils/utils'

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

  get('/', async (req, res) => {
    const startDate =
      new Date(req.query?.startDate as string).toString() === 'Invalid Date'
        ? new Date()
        : new Date(req.query?.startDate as string)
    const formattedStartDate = format(startDate, 'yyyy-MM-dd')

    const visits: VisitInformation[] = await visitSessionsService.getVisitsByDate({
      dateString: formattedStartDate,
      username: res.locals.user?.username,
    })
    const everyVisitPrisoner = visits.map(visit => visit.prisonNumber)
    const prisoners = [...new Set(everyVisitPrisoner)]
    const search = formattedStartDate
    const currentPage = (req.query.page || '1') as string
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch

    let results: PrisonerDetailsItem[][] = []
    let numberOfResults = 0
    let numberOfPages = 1
    let next
    let previous

    if (prisoners.length > 0) {
      ;({ results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisonersByPrisonerNumbers(prisoners, res.locals.user?.username, parsedPage))
    }
    const realNumberOfResults = numberOfResults
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage: parsedPage,
      searchParam: `startDate=${search}`,
      searchUrl: '/visits/',
    })

    return res.render('pages/visits/summary', {
      search,
      results,
      next,
      previous,
      numberOfResults: realNumberOfResults,
      pageSize,
      from: (parsedPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  return router
}
