import type { NextFunction, RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SupportedPrisonsService from '../services/supportedPrisonsService'

export default function routes(router: Router, supportedPrisonsService: SupportedPrisonsService): Router {
  const get = (path: string, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/', establishmentSwitcherCheckMiddleware, async (req, res) => {
    const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)

    res.render('pages/changeEstablishment', {
      supportedPrisons,
    })
  })
  return router
}

const establishmentSwitcherCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { establishmentSwitcherEnabled } = config.features

  if (!establishmentSwitcherEnabled) {
    throw new NotFound()
  }

  next()
}
