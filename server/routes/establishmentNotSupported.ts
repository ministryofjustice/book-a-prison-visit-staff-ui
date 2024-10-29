import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'

export default function routes({ supportedPrisonsService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const activeCaseLoad = res.locals.feComponentsMeta?.activeCaseLoad

    if (
      !activeCaseLoad ||
      (await supportedPrisonsService.isSupportedPrison(res.locals.user.username, activeCaseLoad.caseLoadId))
    ) {
      return res.redirect('/')
    }

    return res.render('pages/establishmentNotSupported', { prisonName: activeCaseLoad.description })
  })

  return router
}
