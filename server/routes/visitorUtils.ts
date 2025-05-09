import type { Request } from 'express'
import type { SessionData } from 'express-session'
import { FlashFormValues, VisitSlot, VisitSlotList } from '../@types/bapv'

export const getSelectedSlot = (slotsList: VisitSlotList, selectedSlot: string): VisitSlot => {
  return Object.values(slotsList)
    .flat()
    .reduce((allSlots, slot) => {
      return allSlots.concat(slot.slots.morning, slot.slots.afternoon)
    }, [])
    .find(slot => slot.id === selectedSlot)
}

export const getSlotByTimeAndRestriction = (
  slotsList: VisitSlotList,
  startTimestamp: string,
  endTimestamp: string,
  visitRestriction: string,
): VisitSlot => {
  return Object.values(slotsList)
    .flat()
    .reduce((allSlots, slot) => {
      return allSlots.concat(slot.slots.morning, slot.slots.afternoon)
    }, [])
    .find(
      slot =>
        slot.startTimestamp === startTimestamp &&
        slot.endTimestamp === endTimestamp &&
        slot.visitRestriction === visitRestriction,
    )
}

export const getFlashFormValues = (req: Request): FlashFormValues => {
  return req.flash('formValues')?.[0] || {}
}

export const clearSession = (req: Request): void => {
  ;['visitorList', 'adultVisitors', 'slotsList', 'visitSessionData', 'cancelledVisitInfo'].forEach(
    (sessionItem: keyof SessionData) => {
      delete req.session[sessionItem]
    },
  )
}
