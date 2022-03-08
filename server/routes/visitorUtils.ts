import type { Response } from 'express'
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
  visitData,
  res,
}: {
  stage: number
  visitData: VisitSessionData
  res: Response
  // eslint-disable-next-line consistent-return
}): void => {
  if (!visitData) {
    return res.redirect('/search/')
  }

  if (
    !visitData.prisoner ||
    !visitData.prisoner.name ||
    !isValidPrisonerNumber(visitData.prisoner.offenderNo || '') ||
    !visitData.prisoner.dateOfBirth ||
    !visitData.prisoner.location
  ) {
    return res.redirect('/search/')
  }

  if (stage > 1 && (!visitData.visitors || visitData.visitors.length === 0)) {
    return res.redirect(`/prisoner/${visitData.prisoner.offenderNo}`)
  }

  if (
    stage > 2 &&
    (!visitData.visit ||
      !visitData.visit.id ||
      !visitData.visit.availableTables ||
      !visitData.visit.startTimestamp ||
      !visitData.visit.endTimestamp)
  ) {
    return res.redirect(`/prisoner/${visitData.prisoner.offenderNo}`)
  }

  if (
    stage > 4 &&
    (!visitData.mainContact ||
      !visitData.mainContact.phoneNumber ||
      (!visitData.mainContact.contact && !visitData.mainContact.contactName))
  ) {
    return res.redirect(`/prisoner/${visitData.prisoner.offenderNo}`)
  }
}
