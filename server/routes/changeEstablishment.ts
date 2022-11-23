import type { NextFunction, RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import { body, validationResult } from 'express-validator'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import { clearSession } from './visitorUtils'
import { safeReturnUrl } from '../utils/utils'
import AuditService from '../services/auditService'

export default function routes(
  router: Router,
  supportedPrisonsService: SupportedPrisonsService,
  auditService: AuditService,
): Router {
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
    const redirectUrl = safeReturnUrl(referrer)

    res.render('pages/changeEstablishment', {
      errors: req.flash('errors'),
      supportedPrisons,
      referrer: redirectUrl,
    })
  })

  post('/', establishmentSwitcherCheckMiddleware, async (req, res) => {
    const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(res.locals.user?.username)
    await body('establishment').isIn(Object.keys(supportedPrisons)).withMessage('No prison selected').run(req)

    const referrer = (req.query?.referrer as string) ?? ''
    const redirectUrl = safeReturnUrl(referrer)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(req.originalUrl)
    }

    clearSession(req)

    await auditService.changeEstablishment({
      previousEstablishment: req.session.selectedEstablishment.prisonId,
      newEstablishment: req.body.establishment,
      username: res.locals.user?.username,
      operationId: res.locals.appInsightsOperationId,
    })

    const { selectedEstablishment } = req.session
    selectedEstablishment.prisonId = req.body.establishment
    selectedEstablishment.prisonName = supportedPrisons[req.body.establishment]

    return res.redirect(redirectUrl)
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
