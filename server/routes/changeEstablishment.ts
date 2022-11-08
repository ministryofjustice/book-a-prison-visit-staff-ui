import type { RequestHandler, Router } from 'express'
import { Prison } from '../@types/bapv'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const enabledPrisons: Prison[] = [
    { prisonId: 'HEI', prisonName: 'Hewell (HMP)' },
    { prisonId: 'BLI', prisonName: 'Bristol (HMP)' },
  ]

  get('/', (req, res, next) => {
    res.render('pages/changeEstablishment', {
      enabledPrisons,
    })
  })
  return router
}
