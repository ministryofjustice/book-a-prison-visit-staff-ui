import type { RequestHandler, Router } from 'express'
import url from 'url'
import validateForm from './searchForPrisonerValidation'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'
import config from '../config'
import { getPageLinks } from '../utils/utils'

export default function routes(router: Router, prisonerSearchService: PrisonerSearchService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    const search = req?.body?.search

    res.render('pages/search', { search })
  })

  post('/', (req, res) => {
    const { search } = req.body

    return res.redirect(
      url.format({
        pathname: '/search/results',
        query: {
          ...(search && { search }),
        },
      })
    )
  })

  get('/results', async (req, res) => {
    const search = (req.query.search || '') as string
    const currentPage = (req.query.page || '') as string
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch
    const error = validateForm(search)
    const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
      search,
      res.locals.user?.username,
      parsedPage
    )
    const realNumberOfResults = error ? 0 : numberOfResults
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    const pageLinks = getPageLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage: parsedPage,
      searchTerm: search,
    })

    res.render('pages/searchResults', {
      establishment: 'Hewell (HMP)',
      search,
      results: error ? [] : results,
      error,
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
