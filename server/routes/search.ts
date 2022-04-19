import type { Router } from 'express'
import url from 'url'
import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import config from '../config'
import { getPageLinks } from '../utils/utils'
import { VisitInformation } from '../@types/bapv'

export default function routes(
  router: Router,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService
): Router {
  router.get('/prisoner', (req, res) => {
    const search = req?.body?.search

    res.render('pages/search/prisoner', { search })
  })

  router.post('/prisoner', (req, res) => {
    const { search } = req.body

    return res.redirect(
      url.format({
        pathname: '/search/prisoner/results',
        query: {
          ...(search && { search }),
        },
      })
    )
  })

  router.get('/prisoner/results', async (req, res) => {
    const search = (req.query.search || '') as string
    const currentPage = (req.query.page || '') as string
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch
    const validationErrors = validatePrisonerSearch(search)
    const errors = validationErrors ? [validationErrors] : []
    const { results, numberOfResults, numberOfPages, next, previous } = await prisonerSearchService.getPrisoners(
      search,
      res.locals.user?.username,
      parsedPage
    )
    const realNumberOfResults = errors.length > 0 ? 0 : numberOfResults
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    const pageLinks = getPageLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage: parsedPage,
      searchTerm: search,
    })

    res.render('pages/search/prisonerResults', {
      establishment: 'Hewell (HMP)',
      search,
      results: errors.length > 0 ? [] : results,
      errors,
      next,
      previous,
      numberOfResults: realNumberOfResults,
      pageSize,
      from: (parsedPage - 1) * pageSize + 1,
      to,
      pageLinks: numberOfPages <= 1 ? [] : pageLinks,
    })
  })

  router.get('/visit', (req, res) => {
    const searchBlock1 = req?.body?.searchBlock1
    const searchBlock2 = req?.body?.searchBlock2
    const searchBlock3 = req?.body?.searchBlock3
    const searchBlock4 = req?.body?.searchBlock4

    res.render('pages/search/visit', { searchBlock1, searchBlock2, searchBlock3, searchBlock4 })
  })

  router.post('/visit', (req, res) => {
    const { searchBlock1, searchBlock2, searchBlock3, searchBlock4 } = req.body

    return res.redirect(
      url.format({
        pathname: '/search/visit/results',
        query: {
          ...(searchBlock1 && { searchBlock1, searchBlock2, searchBlock3, searchBlock4 }),
        },
      })
    )
  })

  router.get('/visit/results', async (req, res) => {
    const { searchBlock1, searchBlock2, searchBlock3, searchBlock4 } = req.query
    const search = `${searchBlock1}-${searchBlock2}-${searchBlock3}-${searchBlock4}`

    const currentPage = '1'
    const numberOfPages = 1
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize, pagesLinksToShow } = config.apis.prisonerSearch
    const validationErrors = validateVisitSearch(search)
    const errors = validationErrors ? [validationErrors] : []
    let visit: VisitInformation

    if (errors.length === 0) {
      try {
        visit = await visitSessionsService.getVisit({ reference: search, username: res.locals.user?.username })
        const prisonerDetails = await prisonerSearchService.getPrisoner(visit.prisonNumber, res.locals.user?.username)
        visit.prisonerName = `${prisonerDetails.lastName}, ${prisonerDetails.firstName}`
      } catch (e) {
        errors.push({
          msg: e.message,
          param: '#searchBlock1',
        })
      }
    }

    const realNumberOfResults = errors.length > 0 ? 0 : 1
    const currentPageMax = parsedPage * pageSize
    const to = realNumberOfResults < currentPageMax ? realNumberOfResults : currentPageMax
    const pageLinks = getPageLinks({
      pagesToShow: pagesLinksToShow,
      numberOfPages: 1,
      currentPage: parsedPage,
      searchTerm: search,
    })

    res.render('pages/search/visitResults', {
      establishment: 'Hewell (HMP)',
      searchBlock1,
      searchBlock2,
      searchBlock3,
      searchBlock4,
      results: errors.length > 0 ? [] : [visit],
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
