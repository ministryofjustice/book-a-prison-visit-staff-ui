import type { RequestHandler, Router } from 'express'
import url from 'url'
import validateForm from './searchForPrisonerValidation'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import PrisonerSearchService from '../services/prisonerSearchService'
import RestClient from '../data/restClient'
import systemToken from '../data/authClient'
import config from '../config'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', (req, res, next) => {
    const search = req?.body?.search

    res.render('pages/search', { search })
  })

  post('/', (req, res, next) => {
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

  get('/results', async (req, res, next) => {
    const { search } = req.query
    const error = validateForm(`${search}`)
    const token = await systemToken()
    const restClient = new RestClient('Prisoner Search REST Client', config.apis.prisonerSearch, token)
    const prisonerSearchService = new PrisonerSearchService(new PrisonerSearchClient(restClient))

    res.render('pages/searchResults', {
      results: error ? [] : await prisonerSearchService.getPrisoners(`${search}`),
      error,
    })
  })

  return router
}
