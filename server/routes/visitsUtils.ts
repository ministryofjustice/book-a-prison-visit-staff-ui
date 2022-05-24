import { format, parse, add } from 'date-fns'
import { VisitsPageSlot } from '../@types/bapv'
import { sortByTimestamp } from '../utils/utils'

export const getParsedDateFromQueryString = (dateFromQueryString: string, defaultDate = new Date()): string => {
  const parsedDate =
    new Date(dateFromQueryString).toString() === 'Invalid Date' ? defaultDate : new Date(dateFromQueryString)
  return format(parsedDate, 'yyyy-MM-dd')
}

export const getDateTabs = (
  selectedDate: string,
  firstTabDate: string,
  numberOfTabs: number,
  defaultDate = new Date()
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
    const item = {
      text: format(dateToUse, 'EEEE d MMMM yyyy'),
      href: `/visits?selectedDate=${dateCheck}&firstTabDate=${validfirstTabDate}`,
      active: dateCheck === selectedDate,
    }

    tabs.push(item)
  }

  return tabs
}

export function getSlotsSideMenuData({
  slotFilter,
  slotType = '',
  selectedDate = '',
  openSlots,
  closedSlots,
}: {
  slotFilter: string
  slotType: string
  selectedDate: string
  openSlots: VisitsPageSlot[]
  closedSlots: VisitsPageSlot[]
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
  console.log(slotFilter)
  console.log(slotType)
  console.log(selectedDate)
  console.log(JSON.stringify(openSlots))
  console.log(JSON.stringify(closedSlots))
  const openSlotOptions = openSlots.sort(sortByTimestamp).map(slot => {
    return {
      text: slot.visitTime,
      href: `/visits?selectedDate=${selectedDate}&time=${slot.visitTime}&type=OPEN`,
      active: slotFilter === slot.visitTime && slotType === slot.visitType,
    }
  })

  const closedSlotOptions = closedSlots.sort(sortByTimestamp).map(slot => {
    return {
      text: slot.visitTime,
      href: `/visits?selectedDate=${selectedDate}&time=${slot.visitTime}&type=CLOSED`,
      active: slotFilter === slot.visitTime && slotType === slot.visitType,
    }
  })

  const slotsNav = []

  if (openSlotOptions.length > 0) {
    slotsNav.push({
      heading: {
        text: 'Main visits room',
        classes: 'govuk-!-padding-top-0',
      },
      items: openSlotOptions,
    })
  }

  if (closedSlotOptions.length > 0) {
    slotsNav.push({
      heading: {
        text: 'Closed visits room',
        classes: 'govuk-!-padding-top-0',
      },
      items: closedSlotOptions,
    })
  }
  console.log(JSON.stringify(slotsNav))
  return slotsNav
}
