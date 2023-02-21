import { format, parse, add } from 'date-fns'
import { VisitsPageSlot } from '../@types/bapv'
import { getParsedDateFromQueryString, sortByTimestamp } from '../utils/utils'

export const getDateTabs = (
  sessionDate: string,
  firstTabDate: string,
  numberOfTabs: number,
  defaultDate = new Date(),
): {
  text: string
  href: string
  active: boolean
}[] => {
  const validfirstTabDate = getParsedDateFromQueryString(firstTabDate, defaultDate)
  const firstTabDateObject = parse(validfirstTabDate, 'yyyy-MM-dd', defaultDate)
  const tabs = []

  for (let tab = 0; tab < numberOfTabs; tab += 1) {
    const dateToUse = add(firstTabDateObject, { days: tab })
    const dateCheck = format(dateToUse, 'yyyy-MM-dd')
    const queryParams = new URLSearchParams({
      sessionDate: dateCheck,
      firstTabDate: validfirstTabDate,
    }).toString()
    const item = {
      text: format(dateToUse, 'EEEE d MMMM yyyy'),
      href: `/visits?${queryParams}`,
      active: dateCheck === sessionDate,
    }

    tabs.push(item)
  }

  return tabs
}

const getSlotOptions = (
  slot: VisitsPageSlot,
  sessionDate: string,
  firstTabDate: string,
  slotFilter: string,
  slotType: string,
  visitType: string,
) => {
  const queryParams = new URLSearchParams({
    type: visitType,
    time: slot.visitTime,
    sessionDate,
    firstTabDate,
  }).toString()

  return {
    text: slot.visitTime,
    href: `/visits?${queryParams}`,
    active: slotFilter === slot.visitTime && slotType === slot.visitType,
  }
}

export function getSlotsSideMenuData({
  slotFilter,
  slotType = '',
  sessionDate = '',
  firstTabDate = '',
  openSlots,
  closedSlots,
  unknownSlots,
}: {
  slotFilter: string
  slotType: string
  sessionDate: string
  firstTabDate: string
  openSlots: VisitsPageSlot[]
  closedSlots: VisitsPageSlot[]
  unknownSlots: VisitsPageSlot[]
}): {
  heading: {
    text: string
    classes: string
  }
  items: {
    text: string
    href: string
    active: boolean
  }[]
}[] {
  const openSlotOptions = openSlots
    .sort(sortByTimestamp)
    .map(slot => getSlotOptions(slot, sessionDate, firstTabDate, slotFilter, slotType, 'OPEN'))
  const closedSlotOptions = closedSlots
    .sort(sortByTimestamp)
    .map(slot => getSlotOptions(slot, sessionDate, firstTabDate, slotFilter, slotType, 'CLOSED'))
  const unknownSlotOptions = unknownSlots
    .sort(sortByTimestamp)
    .map(slot => getSlotOptions(slot, sessionDate, firstTabDate, slotFilter, slotType, 'UNKNOWN'))

  const slotsNav = []

  if (openSlotOptions.length > 0) {
    slotsNav.push({
      heading: {
        text: 'Open visits',
        classes: 'govuk-!-padding-top-0',
      },
      items: openSlotOptions,
    })
  }

  if (closedSlotOptions.length > 0) {
    slotsNav.push({
      heading: {
        text: 'Closed visits',
        classes: 'govuk-!-padding-top-0',
      },
      items: closedSlotOptions,
    })
  }

  if (unknownSlotOptions.length > 0) {
    slotsNav.push({
      heading: {
        text: 'Visit type unknown',
        classes: 'govuk-!-padding-top-0',
      },
      items: unknownSlotOptions,
    })
  }

  return slotsNav
}
