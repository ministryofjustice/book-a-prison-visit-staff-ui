import type { RequestHandler, Router } from 'express'
import url from 'url'
import validateForm from './searchForPrisonerValidation'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchService from '../services/prisonerSearchService'

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
    const error = validateForm(search)
    const results = error ? [] : await prisonerSearchService.getPrisoners(search, res.locals.user?.username)

    res.render('pages/searchResults', {
      establishment: 'Hewell (HMP)',
      search,
      results,
      error,
    })
  })

  return router
}
