import { type RequestHandler, Router } from 'express'
import { body, validationResult } from 'express-validator'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { clearSession } from './visitorUtils'
import { safeReturnUrl } from '../utils/utils'
import type { Services, SupportedPrisonsService, UserService } from '../services'
import { Prison } from '../@types/bapv'

export default function routes({ auditService, supportedPrisonsService, userService }: Services): Router {
  const router = Router()

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

  get('/', async (req, res) => {
    const availablePrisons = await getAvailablePrisonsForUser(
      supportedPrisonsService,
      userService,
      res.locals.user.username,
    )

    const referrer = (req.query?.referrer as string) ?? ''
    const redirectUrl = safeReturnUrl(referrer)

    res.render('pages/changeEstablishment', {
      errors: req.flash('errors'),
      availablePrisons,
      referrer: redirectUrl,
    })
  })

  post('/', async (req, res) => {
    const availablePrisons = await getAvailablePrisonsForUser(
      supportedPrisonsService,
      userService,
      res.locals.user.username,
    )

    await body('establishment').isIn(Object.keys(availablePrisons)).withMessage('No prison selected').run(req)

    const referrer = (req.query?.referrer as string) ?? ''
    const redirectUrl = safeReturnUrl(referrer)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect('/change-establishment')
    }

    clearSession(req)

    const { maxTotalVisitors, policyNoticeDaysMin } = await supportedPrisonsService.getPrisonConfig(
      res.locals.user.username,
      req.body.establishment,
    )

    const previousEstablishment = req.session.selectedEstablishment?.prisonId
    const newEstablishment: Prison = {
      prisonId: req.body.establishment,
      prisonName: availablePrisons[req.body.establishment],
      maxTotalVisitors,
      policyNoticeDaysMin,
    }

    req.session.selectedEstablishment = Object.assign(req.session.selectedEstablishment ?? {}, newEstablishment)

    await auditService.changeEstablishment({
      previousEstablishment,
      newEstablishment: newEstablishment.prisonId,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

    await userService.setActiveCaseLoad(newEstablishment.prisonId, res.locals.user.username)

    return res.redirect(redirectUrl)
  })

  return router
}

async function getAvailablePrisonsForUser(
  supportedPrisonsService: SupportedPrisonsService,
  userService: UserService,
  username: string,
): Promise<Record<string, string>> {
  const supportedPrisons = await supportedPrisonsService.getSupportedPrisons(username)
  const userCaseLoadsIds = await userService.getUserCaseLoadIds(username)

  const availablePrisonsForUser: Record<string, string> = {}

  Object.keys(supportedPrisons)
    .filter(prisonId => userCaseLoadsIds.includes(prisonId))
    .forEach(prisonId => {
      availablePrisonsForUser[prisonId] = supportedPrisons[prisonId]
    })

  const prisonsSortedByName = Object.entries(availablePrisonsForUser).sort((a, b) => a[1].localeCompare(b[1]))

  return Object.fromEntries(prisonsSortedByName)
}
