import type { RequestHandler, Router } from 'express'
import { BadRequest } from 'http-errors'
import { VisitSessionData } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerProfileService from '../services/prisonerProfileService'
import { validatePrisonerSearch } from './searchValidation'

export default function routes(router: Router, prisonerProfileService: PrisonerProfileService): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!validatePrisonerSearch(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerProfile = await prisonerProfileService.getProfile(offenderNo, res.locals.user?.username)
    const location = prisonerProfile.inmateDetail.assignedLivingUnit
    const visitSessionData: VisitSessionData = {
      prisoner: {
        name: prisonerProfile.displayName,
        offenderNo,
        dateOfBirth: prisonerProfile.displayDob,
        location: location ? `${location.description}, ${location.agencyName}` : '',
      },
    }

    req.session.visitSessionData = visitSessionData

    return res.render('pages/prisoner', { ...prisonerProfile })
  })

  return router
}
