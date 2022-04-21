import type { RequestHandler, Router } from 'express'
import { BadRequest, NotFound } from 'http-errors'
import { VisitSessionData } from '../@types/bapv'
import asyncMiddleware from '../middleware/asyncMiddleware'
import PrisonerProfileService from '../services/prisonerProfileService'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { isValidPrisonerNumber } from './validationChecks'

export default function routes(
  router: Router,
  prisonerProfileService: PrisonerProfileService,
  prisonerSearchService: PrisonerSearchService,
  visitSessionsService: VisitSessionsService
): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
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

    return res.render('pages/prisoner/profile', { ...prisonerProfile })
  })

  get('/visits/:offenderNo', async (req, res) => {
    const { offenderNo } = req.params

    if (!isValidPrisonerNumber(offenderNo)) {
      throw new BadRequest()
    }

    const prisonerDetails = await prisonerSearchService.getPrisoner(offenderNo, res.locals.user?.username)
    if (prisonerDetails === null) {
      throw new NotFound()
    }
    const prisonerName = `${prisonerDetails.lastName}, ${prisonerDetails.firstName}`

    const visits = await visitSessionsService.getUpcomingVisits({ username: res.locals.user?.username, offenderNo })

    return res.render('pages/prisoner/visits', { offenderNo, prisonerName, visits })
  })

  return router
}
