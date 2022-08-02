import { isAfter, isBefore, parseISO } from 'date-fns'
import { ExtendedVisitInformation, PrisonerEvent, VisitsPageSlot } from '../@types/bapv'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import { sortByTimestamp } from './utils'

export const getVisitSlotsFromBookedVisits = (
  visits: ExtendedVisitInformation[],
): {
  openSlots: VisitsPageSlot[]
  closedSlots: VisitsPageSlot[]
  firstSlotTime: string
} => {
  const slots: {
    OPEN: VisitsPageSlot[]
    CLOSED: VisitsPageSlot[]
  } = {
    OPEN: [],
    CLOSED: [],
  }

  visits.forEach((visit: ExtendedVisitInformation) => {
    const visitRestriction = visit.visitRestriction === 'OPEN' ? 'OPEN' : 'CLOSED'

    let matchingSlot = slots[visitRestriction].findIndex(slot => slot.visitTime === visit.visitTime)

    if (matchingSlot < 0) {
      slots[visitRestriction].push({
        visitTime: visit.visitTime,
        visitType: visitRestriction,
        sortField: visit.startTimestamp,
        adults: 0,
        children: 0,
      })

      matchingSlot = slots[visitRestriction].length - 1
    }

    slots[visitRestriction][matchingSlot].adults += visit.visitors.filter(visitor => visitor.adult).length
    slots[visitRestriction][matchingSlot].children += visit.visitors.filter(visitor => !visitor.adult).length
  })

  let firstSlotTime: string

  if (slots.OPEN.length > 0) {
    firstSlotTime = slots.OPEN.sort(sortByTimestamp)[0].visitTime
  } else if (slots.CLOSED.length > 0) {
    firstSlotTime = slots.CLOSED.sort(sortByTimestamp)[0].visitTime
  }

  return {
    openSlots: slots.OPEN,
    closedSlots: slots.CLOSED,
    firstSlotTime,
  }
}

export const getPrisonerEvents = (events: ScheduledEvent[], start: Date, end: Date): PrisonerEvent[] => {
  return events
    .filter(event => {
      const eventStart = parseISO(event.startTime)

      return isAfter(eventStart, start) && isBefore(eventStart, end)
    })
    .map(event => {
      return {
        startTimestamp: event.startTime,
        endTimestamp: event.endTime,
        description: event.eventSourceDesc,
      }
    })
}
