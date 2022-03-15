import type { Request, Response } from 'express'
import { VisitSessionData, VisitSlot, VisitSlotList } from '../@types/bapv'
import isValidPrisonerNumber from './prisonerProfileValidation'

export const getSelectedSlot = (slotsList: VisitSlotList, selectedSlot: string): VisitSlot => {
  return Object.values(slotsList)
    .flat()
    .reduce((allSlots, slot) => {
      return allSlots.concat(slot.slots.morning, slot.slots.afternoon)
    }, [])
    .find(slot => slot.id === selectedSlot)
}

export const checkSession = ({
  stage,
  visitSessionData,
  res,
}: {
  stage: number
  visitSessionData: VisitSessionData
  res: Response
  // eslint-disable-next-line consistent-return
}): void => {
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
}

export const getFlashFormValues = (req: Request): Record<string, string | string[]> => {
  return (req.flash('formValues')?.[0] as unknown as Record<string, string | string[]>) || {}
}
