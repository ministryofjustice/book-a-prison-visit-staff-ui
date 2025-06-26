import { Router } from 'express'
import { body } from 'express-validator'
import url from 'url'
import type { Services } from '../services'
import config from '../config'
import { getResultsPagingLinks } from '../utils/utils'
import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'
import { extractPrisonerNumber } from './validationChecks'
import { VisitInformation } from '../@types/bapv'

export default function routes({ auditService, prisonerSearchService, visitService }: Services): Router {
  const router = Router()

  router.get('/prisoner', (req, res) => {
    const search = req?.body?.search

    res.render('pages/search/prisoner', {
      search,
      visit: req.originalUrl.includes('-visit'),
    })
  })

  router.post('/prisoner', body('search').trim('. '), (req, res) => {
    const { search } = req.body

    return res.redirect(
      url.format({
        pathname: `/search/prisoner/results`,
        query: {
          ...(search && { search }),
        },
      }),
    )
  })

  router.get('/prisoner/results', async (req, res) => {
    const { prisonId } = req.session.selectedEstablishment
    const search = typeof req.query.search === 'string' ? req.query.search : ''

    const currentPage = typeof req.query.page === 'string' ? req.query.page : ''
    const parsedPage = Number.parseInt(currentPage, 10) || 1
    const { pageSize } = config.apis.prisonerSearch

    const validationErrors = validatePrisonerSearch(search)
    const errors = validationErrors ? [validationErrors] : []
    const hasValidationErrors = errors.length > 0

    const { results, numberOfPages, numberOfResults, next, previous } = hasValidationErrors
      ? { results: 0, numberOfPages: 0, numberOfResults: 0, next: 0, previous: 0 }
      : await prisonerSearchService.getPrisoners(search, prisonId, res.locals.user.username, parsedPage)

    if (!hasValidationErrors) {
      await auditService.prisonerSearch({
        searchTerms: search,
        prisonId,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })
    }

    const currentPageMax = parsedPage * pageSize
    const to = numberOfResults < currentPageMax ? numberOfResults : currentPageMax

    const pageLinks = getResultsPagingLinks({
      pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
      numberOfPages,
      currentPage: parsedPage,
      searchParam: `search=${search}`,
      searchUrl: `/search/prisoner/results`,
    })

    const validPrisonerNumber = extractPrisonerNumber(search)
    let prisonerNotFoundMessage
    if (numberOfResults === 0 && validPrisonerNumber) {
      prisonerNotFoundMessage = await prisonerSearchService.getPrisonerNotFoundMessage(
        validPrisonerNumber,
        req.session.selectedEstablishment.prisonName,
        res.locals.user.username,
      )
    } else {
      prisonerNotFoundMessage = `There are no results for this name or number at ${req.session.selectedEstablishment.prisonName}.`
    }

    res.render('pages/search/prisonerResults', {
      prisonerNotFoundMessage,
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
    })
  })

  router.get('/visit', (req, res) => {
    const searchBlock1 = req?.body?.searchBlock1
    const searchBlock2 = req?.body?.searchBlock2
    const searchBlock3 = req?.body?.searchBlock3
    const searchBlock4 = req?.body?.searchBlock4

    res.render('pages/search/visit', {
      searchBlock1,
      searchBlock2,
      searchBlock3,
      searchBlock4,
      establishmentHref: '/search/visit',
    })
  })

  router.post('/visit', (req, res) => {
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

  router.get('/visit/results', async (req, res) => {
    const searchBlock1 = typeof req.query.searchBlock1 === 'string' ? req.query.searchBlock1 : ''
    const searchBlock2 = typeof req.query.searchBlock2 === 'string' ? req.query.searchBlock2 : ''
    const searchBlock3 = typeof req.query.searchBlock3 === 'string' ? req.query.searchBlock3 : ''
    const searchBlock4 = typeof req.query.searchBlock4 === 'string' ? req.query.searchBlock4 : ''
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
        visit = await visitService.getVisit({
          reference: search,
          username: res.locals.user.username,
          prisonId: req.session.selectedEstablishment.prisonId,
        })
        const prisonerDetails = await prisonerSearchService.getPrisonerById(
          visit.prisonNumber,
          res.locals.user.username,
        )
        visit.prisonerName = `${prisonerDetails.firstName} ${prisonerDetails.lastName}`
      } catch (e) {
        if (e?.status === 404) {
          noResults = true
        }

        if (e?.status !== 404) {
          errors.push({
            msg: e.message,
            path: 'searchBlock1',
            type: 'field',
          })
        }
      }
    }

    await auditService.visitSearch({
      searchTerms: search,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

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

    const queryParamsForBackLink = new URLSearchParams({
      query: new URLSearchParams({ searchBlock1, searchBlock2, searchBlock3, searchBlock4 }).toString(),
      from: 'visit-search',
    })

    res.render('pages/search/visitResults', {
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
      queryParamsForBackLink,
    })
  })

  return router
}
