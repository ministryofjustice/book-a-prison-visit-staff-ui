import type { Request } from 'express'
import { VisitSlot, VisitSlotList } from '../@types/bapv'
import { SupportType, VisitorSupport } from '../data/visitSchedulerApiTypes'

export const getSelectedSlot = (slotsList: VisitSlotList, selectedSlot: string): VisitSlot => {
  return Object.values(slotsList)
    .flat()
    .reduce((allSlots, slot) => {
      return allSlots.concat(slot.slots.morning, slot.slots.afternoon)
    }, [])
    .find(slot => slot.id === selectedSlot)
}

export const getSlotByStartTimeAndRestriction = (
  slotsList: VisitSlotList,
  startTimestamp: string,
  visitRestriction: string,
): VisitSlot => {
  return Object.values(slotsList)
    .flat()
    .reduce((allSlots, slot) => {
      return allSlots.concat(slot.slots.morning, slot.slots.afternoon)
    }, [])
    .find(slot => slot.startTimestamp === startTimestamp && slot.visitRestriction === visitRestriction)
}

export const getFlashFormValues = (req: Request): Record<string, string | string[]> => {
  return (req.flash('formValues')?.[0] as unknown as Record<string, string | string[]>) || {}
}

export const getSupportTypeDescriptions = (
  availableSupportTypes: SupportType[],
  visitorSupport: VisitorSupport[],
): string[] => {
  return visitorSupport.map(support => {
    return support.type === 'OTHER'
      ? support.text
      : availableSupportTypes.find(type => type.type === support.type).description
  })
}

export const clearSession = (req: Request): void => {
  ;['availableSupportTypes', 'visitorList', 'adultVisitors', 'slotsList', 'visitSessionData'].forEach(sessionItem => {
    delete req.session[sessionItem]
  })
}
