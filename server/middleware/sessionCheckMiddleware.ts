import type { Request, RequestHandler, Response } from 'express'
import logger from '../../logger'
import { isValidPrisonerNumber } from '../routes/validationChecks'

export default function sessionCheckMiddleware({ stage }: { stage: number }): RequestHandler {
  return (req, res, next) => {
    const { selectedEstablishment } = req.session
    const { visitSessionData } = req.session
    const { reference } = req.params

    if (!visitSessionData) {
      return logAndRedirect(req, res, '/search/prisoner/?error=missing-session')
    }

    if (
      visitSessionData.originalVisitSlot &&
      visitSessionData.originalVisitSlot.prisonId !== selectedEstablishment.prisonId
    ) {
      return logAndRedirect(req, res, '/?error=establishment-mismatch')
    }

    if (reference && visitSessionData.visitReference !== reference) {
      return logAndRedirect(req, res, '/?error=reference-mismatch')
    }

    if (
      !visitSessionData.prisoner ||
      !visitSessionData.prisoner.name ||
      !isValidPrisonerNumber(visitSessionData.prisoner.offenderNo || '') ||
      !visitSessionData.prisoner.dateOfBirth ||
      !visitSessionData.prisoner.location
    ) {
      return logAndRedirect(req, res, '/search/prisoner/?error=missing-prisoner')
    }

    if (
      stage > 1 &&
      (!visitSessionData.visitors || visitSessionData.visitors.length === 0 || !visitSessionData.visitRestriction)
    ) {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visitors`)
    }

    if (
      stage > 2 &&
      (!visitSessionData.visitSlot ||
        !visitSessionData.visitSlot.id ||
        typeof visitSessionData.visitSlot.availableTables === 'undefined' ||
        !visitSessionData.visitSlot.startTimestamp ||
        !visitSessionData.visitSlot.endTimestamp)
    ) {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visit`)
    }

    if (stage > 2 && visitSessionData.visitSlot.prisonId !== selectedEstablishment.prisonId) {
      return logAndRedirect(req, res, '/?error=establishment-mismatch')
    }

    if (stage > 2 && !visitSessionData.applicationReference) {
      return logAndRedirect(
        req,
        res,
        `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-application-reference`,
      )
    }

    if (stage > 2 && stage < 7 && !(visitSessionData.visitStatus === undefined)) {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=visit-already-booked`)
    }

    if (stage > 3 && !visitSessionData.visitorSupport) {
      return logAndRedirect(
        req,
        res,
        `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-additional-support`,
      )
    }

    if (
      stage > 4 &&
      (!visitSessionData.mainContact ||
        !visitSessionData.mainContact.phoneNumber ||
        (!visitSessionData.mainContact.contact && !visitSessionData.mainContact.contactName))
    ) {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-main-contact`)
    }

    if (stage > 5 && !visitSessionData.requestMethod) {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-request-method`)
    }

    if (stage > 6 && visitSessionData.visitStatus !== 'BOOKED') {
      return logAndRedirect(req, res, `/prisoner/${visitSessionData.prisoner.offenderNo}?error=visit-not-booked`)
    }

    return next()
  }

  function logAndRedirect(req: Request, res: Response, redirectUrl: string) {
    const { applicationReference, visitReference } = req.session?.visitSessionData ?? {}

    logger.info(
      `Session check failure: stage ${stage}, user: '${res.locals?.user?.username}', ${req.method} ${req.originalUrl}, \
applicationReference: '${applicationReference}', visitReference: '${visitReference}'. Redirecting to '${redirectUrl}'`,
    )

    return res.redirect(redirectUrl)
  }
}
