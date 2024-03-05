import type { Request } from 'express'
import type { SessionData } from 'express-session'
import { VisitSlot, VisitSlotList } from '../@types/bapv'

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

export const getFlashFormValues = (req: Request): Record<string, string | string[]> => {
  return (req.flash('formValues')?.[0] as unknown as Record<string, string | string[]>) || {}
}

export const clearSession = (req: Request): void => {
  ;['visitorList', 'adultVisitors', 'slotsList', 'visitSessionData'].forEach((sessionItem: keyof SessionData) => {
    delete req.session[sessionItem]
  })
}
