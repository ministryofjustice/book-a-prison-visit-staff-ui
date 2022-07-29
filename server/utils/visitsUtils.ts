import { ExtendedVisitInformation, VisitsPageSlot } from '../@types/bapv'
import { sortByTimestamp } from './utils'

const getVisitSlotsFromBookedVisits = (
  visits: ExtendedVisitInformation[],
): {
  openSlots: VisitsPageSlot[]
  closedSlots: VisitsPageSlot[]
  unknownSlots: VisitsPageSlot[]
  firstSlotTime: string
} => {
  const slots: {
    OPEN: VisitsPageSlot[]
    CLOSED: VisitsPageSlot[]
    UNKNOWN: VisitsPageSlot[]
  } = {
    OPEN: [],
    CLOSED: [],
    UNKNOWN: [],
  }

  visits.forEach((visit: ExtendedVisitInformation) => {
    let matchingSlot = slots[visit.visitRestriction].findIndex(slot => slot.visitTime === visit.visitTime)

    if (matchingSlot < 0) {
      slots[visit.visitRestriction].push({
        visitTime: visit.visitTime,
        visitType: visit.visitRestriction,
        sortField: visit.startTimestamp,
        adults: 0,
        children: 0,
      })

      matchingSlot = slots[visit.visitRestriction].length - 1
    }

    slots[visit.visitRestriction][matchingSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
    slots[visit.visitRestriction][matchingSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
  })

  let firstSlotTime: string

  if (slots.OPEN.length > 0) {
    firstSlotTime = slots.OPEN.sort(sortByTimestamp)[0].visitTime
  } else if (slots.CLOSED.length > 0) {
    firstSlotTime = slots.CLOSED.sort(sortByTimestamp)[0].visitTime
  } else if (slots.UNKNOWN.length > 0) {
    firstSlotTime = slots.UNKNOWN.sort(sortByTimestamp)[0].visitTime
  }

  return {
    openSlots: slots.OPEN,
    closedSlots: slots.CLOSED,
    unknownSlots: slots.UNKNOWN,
    firstSlotTime,
  }
}

export default getVisitSlotsFromBookedVisits
