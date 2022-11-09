import type { RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SupportedPrisonsService from '../services/supportedPrisonsService'

export default function routes(router: Router, supportedPrisonsService: SupportedPrisonsService): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)

    res.render('pages/changeEstablishment', {
      supportedPrisons,
    })
  })
  return router
}
