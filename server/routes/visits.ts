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

  const getStartDate = (startDate: string): string => {
    const startDateObject = new Date(startDate).toString() === 'Invalid Date' ? new Date() : new Date(startDate)
    return format(startDateObject, 'yyyy-MM-dd')
  }

  get('/', async (req, res) => {
    const startDate = getStartDate(req.query?.startDate as string)
    const visits: VisitInformation[] = await visitSessionsService.getVisitsByDate({
      dateString: startDate,
      username: res.locals.user?.username,
    })
    const prisoners = [...new Set(visits.map(visit => visit.prisonNumber))]
    const currentPage = Number.parseInt((req.query.page || '1') as string, 10)
    const { pageSize } = config.apis.prisonerSearch

    let results: PrisonerDetailsItem[][] = []
    let numberOfResults = 0
    let numberOfPages = 1
    let next = 1
    let previous = 1

    if (prisoners.length > 0) {
      ;({ results, numberOfResults, numberOfPages, next, previous } =
        await prisonerSearchService.getPrisonersByPrisonerNumbers(prisoners, res.locals.user?.username, currentPage))
    }

    const currentPageMax = currentPage * pageSize
    const to = numberOfResults < currentPageMax ? numberOfResults : currentPageMax
    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage,
      searchParam: `startDate=${startDate}`,
      searchUrl: '/visits/',
    })

    return res.render('pages/visits/summary', {
      startDate,
      results,
      next,
      previous,
      numberOfResults,
      pageSize,
      from: (currentPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  return router
}
