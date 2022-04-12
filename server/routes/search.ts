import type { Router } from 'express'
import url from 'url'
import { body, validationResult } from 'express-validator'
import validateForm from './searchForPrisonerValidation'
import PrisonerSearchService from '../services/prisonerSearchService'
import config from '../config'
import { getPageLinks } from '../utils/utils'
import isValidVisitReference from './visitSchedulerValidation'

export default function routes(router: Router, prisonerSearchService: PrisonerSearchService): Router {
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

    res.render('pages/search/prisonerResults', {
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

  router.get('/visit', (req, res) => {
    const searchBlock1 = req?.body?.searchBlock1
    const searchBlock2 = req?.body?.searchBlock2
    const searchBlock3 = req?.body?.searchBlock3
    const searchBlock4 = req?.body?.searchBlock4

    res.render('pages/search/visit', { searchBlock1, searchBlock2, searchBlock3, searchBlock4 })
  })

  router.post(
    '/visit',
    body('searchBlock1').custom((value: string, { req }) => {
      const searchBlock1 = req?.body?.searchBlock1
      const searchBlock2 = req?.body?.searchBlock2
      const searchBlock3 = req?.body?.searchBlock3
      const searchBlock4 = req?.body?.searchBlock4
      const reference = `${searchBlock1}-${searchBlock2}-${searchBlock3}-${searchBlock4}`

      if (!isValidVisitReference(reference)) {
        throw new Error('Invalid visit reference provided')
      }

      return true
    }),
    (req, res) => {
      const errors = validationResult(req)
      const searchBlock1 = req?.body?.searchBlock1
      const searchBlock2 = req?.body?.searchBlock2
      const searchBlock3 = req?.body?.searchBlock3
      const searchBlock4 = req?.body?.searchBlock4
      const reference = `${searchBlock1}-${searchBlock2}-${searchBlock3}-${searchBlock4}`

      if (!errors.isEmpty()) {
        return res.render('pages/search/visit', {
          errors: errors.array(),
          searchBlock1,
          searchBlock2,
          searchBlock3,
          searchBlock4,
        })
      }

      return res.redirect(`/visit/${reference}`)
    }
  )

  return router
}
