import { format, parse, add } from 'date-fns'
import { VisitsPageSideNav, VisitsPageSideNavItem } from '../@types/bapv'
import { getParsedDateFromQueryString, prisonerTimePretty } from '../utils/utils'
import { SessionSchedule, VisitPreview, VisitRestriction } from '../data/orchestrationApiTypes'

export const getDateTabs = (
  selectedDate: string,
  firstTabDate: string,
  numberOfTabs: number,
  defaultDate = new Date(),
): {
  text: string
  href: string
  active: boolean
}[] => {
  const validFirstTabDate = getParsedDateFromQueryString(firstTabDate, defaultDate)
  const firstTabDateObject = parse(validFirstTabDate, 'yyyy-MM-dd', defaultDate)
  const tabs = []

  for (let tab = 0; tab < numberOfTabs; tab += 1) {
    const dateToUse = add(firstTabDateObject, { days: tab })
    const dateCheck = format(dateToUse, 'yyyy-MM-dd')
    const queryParams = new URLSearchParams({
      selectedDate: dateCheck,
      firstTabDate: validFirstTabDate,
    }).toString()
    const item = {
      text: format(dateToUse, 'EEEE d MMMM yyyy'),
      href: `/visits?${queryParams}`,
      active: dateCheck === selectedDate,
    }

    tabs.push(item)
  }

  return tabs
}

export function getSelectedOrDefaultSessionTemplate(
  sessionSchedule: SessionSchedule[],
  sessionReference: string,
  type: VisitRestriction,
): { sessionReference: string; type: VisitRestriction; times: string; capacity: number } | null {
  if (type === 'UNKNOWN') {
    return null
  }

  // it's the selected session if reference, type (open/closed) match and a capacity is set
  const selectedSession = sessionSchedule.find(
    schedule =>
      schedule.sessionTemplateReference === sessionReference &&
      schedule.capacity[<Lowercase<typeof type>>type.toLowerCase()] > 0,
  )
  if (selectedSession) {
    return {
      sessionReference: selectedSession.sessionTemplateReference,
      type,
      times: sessionTimeSlotToString(selectedSession.sessionTimeSlot),
      capacity: selectedSession.capacity[<Lowercase<typeof type>>type.toLowerCase()],
    }
  }

  // default session is first open one in schedule with capacity...
  const defaultOpenSession = sessionSchedule.find(schedule => schedule.capacity.open > 0)
  if (defaultOpenSession) {
    return {
      sessionReference: defaultOpenSession.sessionTemplateReference,
      type: 'OPEN',
      times: sessionTimeSlotToString(defaultOpenSession.sessionTimeSlot),
      capacity: defaultOpenSession.capacity.open,
    }
  }

  // ...or else the first closed with capacity
  const defaultClosedSession = sessionSchedule.find(schedule => schedule.capacity.closed > 0)
  if (defaultClosedSession) {
    return {
      sessionReference: defaultClosedSession.sessionTemplateReference,
      type: 'CLOSED',
      times: sessionTimeSlotToString(defaultClosedSession.sessionTimeSlot),
      capacity: defaultClosedSession.capacity.closed,
    }
  }

  // there are no sessions
  return null
}

export function getSessionsSideNav(
  sessionSchedule: SessionSchedule[],
  unknownVisits: VisitPreview[],
  selectedDate: string,
  firstTabDate: string,
  selectedReference: string,
): VisitsPageSideNav {
  const sessionsSideNav: VisitsPageSideNav = new Map()

  sessionSchedule.forEach(session => {
    if (!sessionsSideNav.has(session.visitRoom)) {
      sessionsSideNav.set(session.visitRoom, [])
    }
    const sideNavForRoom = sessionsSideNav.get(session.visitRoom)

    const times = sessionTimeSlotToString(session.sessionTimeSlot)

    const queryParams = new URLSearchParams({
      sessionReference: session.sessionTemplateReference,
      selectedDate,
      firstTabDate,
    }).toString()

    sideNavForRoom.push({
      times,
      reference: session.sessionTemplateReference,
      queryParams,
      active: selectedReference === session.sessionTemplateReference,
    })
  })

  if (!unknownVisits.length) {
    return sessionsSideNav
  }

  // build sorted nav item(s) from de-duped times in unknown visit(s)
  const unknownVisitsNavItems: VisitsPageSideNavItem[] = []

  unknownVisits.forEach(visit => {
    const timeSlotReference = `${visit.visitTimeSlot.startTime}-${visit.visitTimeSlot.endTime}`
    const slotRefExists = unknownVisitsNavItems.some(slot => slot.reference === timeSlotReference)

    if (!slotRefExists) {
      const queryParams = new URLSearchParams({
        sessionReference: timeSlotReference,
        selectedDate,
        firstTabDate,
      }).toString()

      unknownVisitsNavItems.push({
        reference: timeSlotReference,
        times: sessionTimeSlotToString(visit.visitTimeSlot),
        queryParams,
        active: selectedReference === timeSlotReference,
      })
    }
  })

  unknownVisitsNavItems.sort((a, b) => a.reference.localeCompare(b.reference))

  // default first unknown session to selected if no open/closed
  const unknownOnly = sessionsSideNav.size === 0
  const isASelectedUnknownSession = unknownVisitsNavItems.some(u => u.active)
  if (unknownOnly && !isASelectedUnknownSession) {
    unknownVisitsNavItems[0].active = true
  }

  sessionsSideNav.set('All visits', unknownVisitsNavItems)

  return sessionsSideNav
}

function sessionTimeSlotToString(sessionTimeSlot: SessionSchedule['sessionTimeSlot']): string {
  const startTime = prisonerTimePretty(parse(sessionTimeSlot.startTime, 'HH:mm', new Date()).toISOString())
  const endTime = prisonerTimePretty(parse(sessionTimeSlot.endTime, 'HH:mm', new Date()).toISOString())
  return `${startTime} to ${endTime}`
}
