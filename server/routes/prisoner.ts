import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerProfileService from '../services/prisonerProfileService'
import isValidPrisonerNumber from './prisonerProfileValidation'

export default function routes(router: Router, prisonerProfileService: PrisonerProfileService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerProfile = await prisonerProfileService.getProfile(offenderNo, res.locals.user?.username)

    req.session.prisonerName = prisonerProfile.displayName
    req.session.prisonerDob = prisonerProfile.displayDob
    req.session.offenderNo = offenderNo

    res.render('pages/prisoner', { ...prisonerProfile })
  })

  return router
}
