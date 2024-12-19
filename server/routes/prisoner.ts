import { type RequestHandler, type Request, Router } from 'express'
import { body, validationResult } from 'express-validator'
import { BadRequest } from 'http-errors'
import { VisitSessionData } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { isValidPrisonerNumber } from './validationChecks'
import { clearSession } from './visitorUtils'
import type { Services } from '../services'
import config from '../config'

export default function routes({ auditService, prisonerProfileService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const prisonerId = getOffenderNo(req)
    const { prisonId } = req.session.selectedEstablishment
    const search = (req.query?.search as string) ?? ''
    const queryParamsForBackLink = search !== '' ? new URLSearchParams({ search }).toString() : ''

    const prisonerProfile = await prisonerProfileService.getProfile(prisonId, prisonerId, res.locals.user.username)

    await auditService.viewPrisoner({
      prisonerId,
      prisonId,
      username: res.locals.user.username,
      operationId: res.locals.appInsightsOperationId,
    })

    const prisonerDpsAlertsUrl = `${config.dpsPrisoner}prisoner/${prisonerId}/alerts/active`

    return res.render('pages/prisoner/profile', {
      errors: req.flash('errors'),
      ...prisonerProfile,
      queryParamsForBackLink,
      prisonerDpsAlertsUrl,
    })
  })

  post('/:offenderNo', async (req, res) => {
    const offenderNo = getOffenderNo(req)
    const { prisonId } = req.session.selectedEstablishment
    const { username } = res.locals.user

    const { prisonerDetails, activeAlerts } = await prisonerProfileService.getProfile(prisonId, offenderNo, username)

    const restrictions = await prisonerProfileService.getRestrictions(offenderNo, username)

    if (prisonerDetails.visitBalances?.remainingVo <= 0 && prisonerDetails.visitBalances?.remainingPvo <= 0) {
      await body('vo-override').equals('override').withMessage('Select the box to book a prison visit').run(req)

      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array() as [])
        return res.redirect(`/prisoner/${offenderNo}`)
      }

      await auditService.overrodeZeroVO({
        prisonerId: offenderNo,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })
    }

    clearSession(req)
    const visitSessionData: VisitSessionData = req.session.visitSessionData ?? {
      prisoner: undefined,
      allowOverBooking: false,
    }

    visitSessionData.prisoner = {
      name: prisonerDetails.name,
      offenderNo,
      dateOfBirth: prisonerDetails.dateOfBirth,
      location: prisonerDetails.cellLocation ? `${prisonerDetails.cellLocation}, ${prisonerDetails.prisonName}` : '',
      activeAlerts,
      restrictions,
    }

    req.session.visitSessionData = visitSessionData

    return res.redirect('/book-a-visit/select-visitors')
  })

  return router
}

function getOffenderNo(req: Request): string {
  const { offenderNo } = req.params

  if (!isValidPrisonerNumber(offenderNo)) {
    throw new BadRequest()
  }
  return offenderNo
}
