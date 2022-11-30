import { RequestHandler } from 'express'
import { isValidPrisonerNumber } from '../routes/validationChecks'

export default function sessionCheckMiddleware({ stage }: { stage: number }): RequestHandler {
  return (req, res, next) => {
    const { visitSessionData } = req.session
    const { reference } = req.params

    if (!visitSessionData) {
      return res.redirect('/search/prisoner/?error=missing-session')
    }

    if (req.session.selectedEstablishment.prisonId !== visitSessionData.prisonId) {
      return res.redirect('/?error=establishment-mismatch')
    }

    if (reference && visitSessionData.visitReference !== reference) {
      return res.redirect('/?error=reference-mismatch')
    }

    if (
      !visitSessionData.prisoner ||
      !visitSessionData.prisoner.name ||
      !isValidPrisonerNumber(visitSessionData.prisoner.offenderNo || '') ||
      !visitSessionData.prisoner.dateOfBirth ||
      !visitSessionData.prisoner.location
    ) {
      return res.redirect('/search/prisoner/?error=missing-prisoner')
    }

    if (
      stage > 1 &&
      (!visitSessionData.visitors || visitSessionData.visitors.length === 0 || !visitSessionData.visitRestriction)
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visitors`)
    }

    if (
      stage > 2 &&
      (!visitSessionData.visitSlot ||
        !visitSessionData.visitSlot.id ||
        typeof visitSessionData.visitSlot.availableTables === 'undefined' ||
        !visitSessionData.visitSlot.startTimestamp ||
        !visitSessionData.visitSlot.endTimestamp)
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visit`)
    }

    if (stage > 2 && !visitSessionData.visitReference) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-visit-reference`)
    }

    if (
      stage > 2 &&
      stage < 6 &&
      !(visitSessionData.visitStatus === 'RESERVED' || visitSessionData.visitStatus === 'CHANGING')
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=visit-already-booked`)
    }

    if (
      stage > 4 &&
      (!visitSessionData.mainContact ||
        !visitSessionData.mainContact.phoneNumber ||
        (!visitSessionData.mainContact.contact && !visitSessionData.mainContact.contactName))
    ) {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=missing-main-contact`)
    }

    if (stage > 5 && visitSessionData.visitStatus !== 'BOOKED') {
      return res.redirect(`/prisoner/${visitSessionData.prisoner.offenderNo}?error=visit-not-booked`)
    }

    return next()
  }
}
