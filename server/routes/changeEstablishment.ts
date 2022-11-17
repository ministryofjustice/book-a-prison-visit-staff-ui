import type { NextFunction, RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import { body, validationResult } from 'express-validator'
import config from '../config'
import { Prison } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import { clearSession } from './visitorUtils'

export default function routes(router: Router, supportedPrisonsService: SupportedPrisonsService): Router {
  const get = (path: string, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )
  const post = (path: string, ...handlers: RequestHandler[]) =>
    router.post(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  get('/', establishmentSwitcherCheckMiddleware, async (req, res) => {
    const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)

    const referrer = (req.query?.referrer as string) ?? ''

    res.render('pages/changeEstablishment', {
      errors: req.flash('errors'),
      supportedPrisons,
      referrer,
    })
  })

  post('/', establishmentSwitcherCheckMiddleware, async (req, res) => {
    const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)
    await body('establishment').isIn(getPrisonIds(supportedPrisons)).withMessage('No prison selected').run(req)

    const referrer = (req.query?.referrer as string) ?? ''
    const safeReturnUrl =
      referrer.length === 0 || referrer.indexOf('://') > 0 || referrer.indexOf('//') === 0 ? '/' : referrer

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(req.originalUrl)
    }

    clearSession(req)

    const newEstablishment = supportedPrisons.find(prison => prison.prisonId === req.body.establishment)
    req.session.selectedEstablishment = Object.assign(req.session.selectedEstablishment ?? {}, newEstablishment)

    return res.redirect(`${safeReturnUrl}`)
  })

  function getPrisonIds(prisons: Prison[]) {
    return prisons.map(prison => prison.prisonId)
  }
  return router
}

const establishmentSwitcherCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { establishmentSwitcherEnabled } = config.features

  if (!establishmentSwitcherEnabled) {
    throw new NotFound()
  }

  next()
}
