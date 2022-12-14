import type { NextFunction, RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'
import { body, validationResult } from 'express-validator'
import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import { clearSession } from './visitorUtils'
import { safeReturnUrl } from '../utils/utils'
import AuditService from '../services/auditService'
import { Prison } from '../@types/bapv'
import UserService from '../services/userService'

export default function routes(
  router: Router,
  supportedPrisonsService: SupportedPrisonsService,
  auditService: AuditService,
  userService: UserService,
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

    const previousEstablishment = req.session.selectedEstablishment?.prisonId
    const newEstablishment: Prison = {
      prisonId: req.body.establishment,
      prisonName: supportedPrisons[req.body.establishment],
    }

    req.session.selectedEstablishment = Object.assign(req.session.selectedEstablishment ?? {}, newEstablishment)

    await auditService.changeEstablishment({
      previousEstablishment,
      newEstablishment: newEstablishment.prisonId,
      username: res.locals.user?.username,
      operationId: res.locals.appInsightsOperationId,
    })

    await userService.setActiveCaseLoad(newEstablishment.prisonId, res.locals.user?.username)

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
