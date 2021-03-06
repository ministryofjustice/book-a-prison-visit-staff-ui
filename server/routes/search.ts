import type { RequestHandler, Router } from 'express'
import url from 'url'
import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import config from '../config'
import { getResultsPagingLinks } from '../utils/utils'
import { VisitInformation } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService,
  auditService: AuditService,
): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get(['/prisoner', '/prisoner-visit'], (req, res) => {
    const search = req?.body?.search

    res.render('pages/search/prisoner', { search, visit: req.originalUrl.includes('-visit') })
  })

  post(['/prisoner', '/prisoner-visit'], (req, res) => {
    const isVisit = req.originalUrl.includes('-visit')
    const { search } = req.body

    return res.redirect(
      url.format({
        pathname: `/search/prisoner${isVisit ? '-visit' : ''}/results`,
        query: {
          ...(search && { search }),
        },
      }),
    )
  })

  get(['/prisoner/results', '/prisoner-visit/results'], async (req, res) => {
    const isVisit = req.originalUrl.includes('-visit')
    const search = (req.query.search || '') as string
    const currentPage = (req.query.page || '') as string
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch
    const validationErrors = validatePrisonerSearch(search)
    const errors = validationErrors ? [validationErrors] : []
    const hasValidationErrors = errors.length > 0

    const { results, numberOfPages, numberOfResults, next, previous } = hasValidationErrors
      ? { results: 0, numberOfPages: 0, numberOfResults: 0, next: 0, previous: 0 }
      : await prisonerSearchService.getPrisoners(search, res.locals.user?.username, parsedPage, isVisit)

    if (!hasValidationErrors) {
      await auditService.prisonerSearch(search, 'HEI', res.locals.user?.username, res.locals.appInsightsOperationId)
    }

    const currentPageMax = parsedPage * pageSize
    const to = numberOfResults < currentPageMax ? numberOfResults : currentPageMax

    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage: parsedPage,
      searchParam: `search=${search}`,
      searchUrl: `/search/prisoner${isVisit ? '-visit' : ''}/results`,
    })

    res.render('pages/search/prisonerResults', {
      establishment: 'Hewell (HMP)',
      search,
      results: errors.length > 0 ? [] : results,
      errors,
      next,
      previous,
      numberOfResults,
      pageSize,
      from: (parsedPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
      visit: isVisit,
    })
  })

  get('/visit', (req, res) => {
    const searchBlock1 = req?.body?.searchBlock1
    const searchBlock2 = req?.body?.searchBlock2
    const searchBlock3 = req?.body?.searchBlock3
    const searchBlock4 = req?.body?.searchBlock4

    res.render('pages/search/visit', { searchBlock1, searchBlock2, searchBlock3, searchBlock4 })
  })

  post('/visit', (req, res) => {
    const { searchBlock1, searchBlock2, searchBlock3, searchBlock4 } = req.body

    return res.redirect(
      url.format({
        pathname: '/search/visit/results',
        query: {
          ...(searchBlock1 && { searchBlock1, searchBlock2, searchBlock3, searchBlock4 }),
        },
      }),
    )
  })

  get('/visit/results', async (req, res) => {
    const { searchBlock1, searchBlock2, searchBlock3, searchBlock4 } = req.query
    const search = `${searchBlock1}-${searchBlock2}-${searchBlock3}-${searchBlock4}`

    const currentPage = '1'
    const numberOfPages = 1
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize, pagesLinksToShow } = config.apis.prisonerSearch
    const validationErrors = validateVisitSearch(search)
    const errors = validationErrors ? [validationErrors] : []
    let visit: VisitInformation
    let noResults = false

    if (errors.length === 0) {
      try {
        visit = await visitSessionsService.getVisit({ reference: search, username: res.locals.user?.username })
        const prisonerDetails = await prisonerSearchService.getPrisonerById(
          visit.prisonNumber,
          res.locals.user?.username,
        )
        visit.prisonerName = `${prisonerDetails.lastName}, ${prisonerDetails.firstName}`
      } catch (e) {
        if (e?.status === 404) {
          noResults = true
        }

        if (e?.status !== 404) {
          errors.push({
            msg: e.message,
            param: '#searchBlock1',
          })
        }
      }
    }

    await auditService.visitSearch(search, res.locals.user?.username, res.locals.appInsightsOperationId)

    const realNumberOfResults = errors.length > 0 || noResults ? 0 : 1
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    const pageLinks = getResultsPagingLinks({
      pagesToShow: pagesLinksToShow,
      numberOfPages: 1,
      currentPage: parsedPage,
      searchParam: `search=${search}`,
      searchUrl: '/search/visit/results',
    })

    res.render('pages/search/visitResults', {
      establishment: 'Hewell (HMP)',
      searchBlock1,
      searchBlock2,
      searchBlock3,
      searchBlock4,
      results: errors.length > 0 || noResults ? [] : [visit],
      errors,
      next: 1,
      previous: 1,
      numberOfResults: realNumberOfResults,
      pageSize,
      from: (parsedPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  return router
}
