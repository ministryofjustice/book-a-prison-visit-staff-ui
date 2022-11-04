import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const enabledPrisons = [
    { prisonId: 'HEI', name: 'Hewell (HMP)' },
    { prisonId: 'BLI', name: 'Bristol (HMP)' },
  ]

  get('/', (req, res, next) => {
    res.render('pages/changeEstablishment', {
      hidePhaseBanner: true,
      enabledPrisons,
    })
  })
  return router
}
