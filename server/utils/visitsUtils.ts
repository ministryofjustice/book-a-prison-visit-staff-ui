import { ExtendedVisitInformation, VisitsPageSlot } from '../@types/bapv'
import { sortByTimestamp } from './utils'

const getVisitSlotsFromBookedVisits = (
  visits: ExtendedVisitInformation[],
): {
  openSlots: VisitsPageSlot[]
  closedSlots: VisitsPageSlot[]
  firstSlotTime: string
} => {
  const openSlots: VisitsPageSlot[] = []
  const closedSlots: VisitsPageSlot[] = []

  visits.forEach((visit: ExtendedVisitInformation) => {
    if (visit.visitRestriction === 'OPEN') {
      let matchingOpenSlot = openSlots.findIndex(openSlot => openSlot.visitTime === visit.visitTime)

      if (matchingOpenSlot < 0) {
        openSlots.push({
          visitTime: visit.visitTime,
          visitType: 'OPEN',
          sortField: visit.startTimestamp,
          adults: 0,
          children: 0,
        })

        matchingOpenSlot = openSlots.length - 1
      }

      openSlots[matchingOpenSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
      openSlots[matchingOpenSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
    } else {
      let matchingClosedSlot = closedSlots.findIndex(closedSlot => closedSlot.visitTime === visit.visitTime)

      if (matchingClosedSlot < 0) {
        closedSlots.push({
          visitTime: visit.visitTime,
          visitType: 'CLOSED',
          sortField: visit.startTimestamp,
          adults: 0,
          children: 0,
        })

        matchingClosedSlot = closedSlots.length - 1
      }

      closedSlots[matchingClosedSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
      closedSlots[matchingClosedSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
    }
  })

  let firstSlotTime: string

  if (openSlots.length > 0) {
    firstSlotTime = openSlots.sort(sortByTimestamp)[0].visitTime
  } else if (closedSlots.length > 0) {
    firstSlotTime = closedSlots.sort(sortByTimestamp)[0].visitTime
  }

  return {
    openSlots,
    closedSlots,
    firstSlotTime,
  }
}

export default getVisitSlotsFromBookedVisits
