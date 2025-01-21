import { format, parse, add } from 'date-fns'
import { VisitsPageSideNav, VisitsPageSideNavItem } from '../@types/bapv'
import { getParsedDateFromQueryString, prisonerTimePretty } from '../utils/utils'
import { SessionSchedule, VisitPreview } from '../data/orchestrationApiTypes'

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

export function getSelectedOrDefaultSessionSchedule(
  sessionSchedule: SessionSchedule[],
  sessionReference: string,
  unknownVisits: VisitPreview[],
): SessionSchedule {
  const isValidUnknownVisitTimeSlot = unknownVisits.some(
    visit => `${visit.visitTimeSlot.startTime}-${visit.visitTimeSlot.endTime}` === sessionReference,
  )

  if (!sessionSchedule.length || isValidUnknownVisitTimeSlot) {
    return null
  }

  const selectedSessionSchedule = sessionSchedule.find(session => session.sessionTemplateReference === sessionReference)

  return selectedSessionSchedule ?? sessionSchedule[0]
}

export function getSessionsSideNav(
  sessionSchedule: SessionSchedule[],
  unknownVisits: VisitPreview[],
  selectedDate: string,
  firstTabDate: string,
  selectedReference: string,
): VisitsPageSideNav {
  let sessionsSideNav: VisitsPageSideNav = new Map()

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

  // sort alphabetically by room name heading
  sessionsSideNav = new Map([...sessionsSideNav].sort((a, b) => a[0].localeCompare(b[0])))

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
