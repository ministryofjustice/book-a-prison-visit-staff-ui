import { RequestHandler } from 'express'
import { isValidPrisonerNumber } from '../routes/validationChecks'

export default function sessionCheckMiddleware({ stage }: { stage: number }): RequestHandler {
  return (req, res, next) => {
    const { visitSessionData } = req.session

    if (!visitSessionData) {
      return res.redirect('/search/?error=missing-session')
    }

    if (
      !visitSessionData.prisoner ||
      !visitSessionData.prisoner.name ||
      !isValidPrisonerNumber(visitSessionData.prisoner.offenderNo || '') ||
      !visitSessionData.prisoner.dateOfBirth ||
      !visitSessionData.prisoner.location
    ) {
      return res.redirect('/search/?error=missing-prisoner')
    }

    if (stage > 1 && (!visitSessionData.visitors || visitSessionData.visitors.length === 0)) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visitors`)
    }

    if (
      stage > 2 &&
      (!visitSessionData.visit ||
        !visitSessionData.visit.id ||
        !visitSessionData.visit.availableTables ||
        !visitSessionData.visit.startTimestamp ||
        !visitSessionData.visit.endTimestamp)
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visit`)
    }

    if (
      stage > 4 &&
      (!visitSessionData.mainContact ||
        !visitSessionData.mainContact.phoneNumber ||
        (!visitSessionData.mainContact.contact && !visitSessionData.mainContact.contactName))
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-main-contact`)
    }

    return next()
  }
}
