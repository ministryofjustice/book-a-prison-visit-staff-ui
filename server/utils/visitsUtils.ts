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
  const openSlots: VisitsPageSlot[] = []
  const closedSlots: VisitsPageSlot[] = []
  const unknownSlots: VisitsPageSlot[] = []

  visits.forEach((visit: ExtendedVisitInformation) => {
    if (visit.visitRestriction === 'OPEN') {
      let matchingSlot = openSlots.findIndex(slot => slot.visitTime === visit.visitTime)

      if (matchingSlot < 0) {
        openSlots.push({
          visitTime: visit.visitTime,
          visitType: 'OPEN',
          sortField: visit.startTimestamp,
          adults: 0,
          children: 0,
        })

        matchingSlot = openSlots.length - 1
      }

      openSlots[matchingSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
      openSlots[matchingSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
    } else if (visit.visitRestriction === 'CLOSED') {
      let matchingSlot = closedSlots.findIndex(slot => slot.visitTime === visit.visitTime)

      if (matchingSlot < 0) {
        closedSlots.push({
          visitTime: visit.visitTime,
          visitType: 'CLOSED',
          sortField: visit.startTimestamp,
          adults: 0,
          children: 0,
        })

        matchingSlot = closedSlots.length - 1
      }

      closedSlots[matchingSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
      closedSlots[matchingSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
    } else {
      let matchingSlot = unknownSlots.findIndex(slot => slot.visitTime === visit.visitTime)

      if (matchingSlot < 0) {
        unknownSlots.push({
          visitTime: visit.visitTime,
          visitType: 'UNKNOWN',
          sortField: visit.startTimestamp,
          adults: 0,
          children: 0,
        })

        matchingSlot = unknownSlots.length - 1
      }

      unknownSlots[matchingSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
      unknownSlots[matchingSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
    }
  })

  let firstSlotTime: string

  if (openSlots.length > 0) {
    firstSlotTime = openSlots.sort(sortByTimestamp)[0].visitTime
  } else if (closedSlots.length > 0) {
    firstSlotTime = closedSlots.sort(sortByTimestamp)[0].visitTime
  } else if (unknownSlots.length > 0) {
    firstSlotTime = unknownSlots.sort(sortByTimestamp)[0].visitTime
  }

  return {
    openSlots,
    closedSlots,
    unknownSlots,
    firstSlotTime,
  }
}

export default getVisitSlotsFromBookedVisits
