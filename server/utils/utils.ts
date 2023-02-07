import { differenceInYears, format, parseISO, addDays, startOfMonth, addMonths } from 'date-fns'

export const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const prisonerDatePretty = ({
  dateToFormat,
  wrapDate = true,
}: {
  dateToFormat: string
  wrapDate?: boolean
}): string => {
  if (wrapDate) {
    return format(parseISO(dateToFormat), 'd MMMM yyyy')
  }

  return `<span class="bapv-table_cell--nowrap">${format(parseISO(dateToFormat), 'd MMMM')}</span> ${format(
    parseISO(dateToFormat),
    'yyyy',
  )}`
}

export const prisonerDateTimePretty = (dateToFormat: string): string => {
  return format(parseISO(dateToFormat), 'd MMMM yyyy')
}

export const prisonerTimePretty = (dateToFormat: string): string => {
  return dateToFormat ? format(parseISO(dateToFormat), 'h:mmaaa').replace(':00', '') : null
}

export const properCaseFullName = (name: string): string =>
  isBlank(name)
    ? ''
    : name
        .split(/(\s+)/)
        .filter(s => s.trim().length)
        .map(properCaseName)
        .join(' ')

export const getResultsPagingLinks = ({
  pagesToShow = 1,
  numberOfPages = 1,
  currentPage = 1,
  searchParam = '',
  searchUrl,
}: {
  pagesToShow: number
  numberOfPages: number
  currentPage: number
  searchParam: string
  searchUrl: string
}): Array<{ text: string; href: string; selected: boolean }> => {
  let pageStartNumber = 1
  let pageEndNumber = pagesToShow
  const pageLinks = []

  if (numberOfPages <= pagesToShow) {
    pageEndNumber = numberOfPages
  } else {
    const endPageOffset = currentPage + (pagesToShow - 1)

    if (endPageOffset === numberOfPages) {
      pageStartNumber = endPageOffset - (pagesToShow - 1)
      pageEndNumber = endPageOffset
    } else if (endPageOffset > numberOfPages) {
      pageStartNumber = numberOfPages - pagesToShow + 1
      pageEndNumber = numberOfPages
    } else {
      pageStartNumber = currentPage
      pageEndNumber = endPageOffset
    }
  }

  for (let pageIndex = pageStartNumber; pageIndex <= pageEndNumber; pageIndex += 1) {
    pageLinks.push({
      text: pageIndex.toString(),
      href: `${searchUrl}?${searchParam}&page=${pageIndex}`,
      selected: pageIndex === currentPage,
    })
  }

  return pageLinks
}

/**
 * Checks if the date of birth represents an adult
 * @param dateOfBirth date of birth string
 * @param referenceDate date to check against (defaults to now)
 * @returns true if an adult
 */
export const isAdult = (dateOfBirth: string, referenceDate: Date = new Date()): boolean => {
  const dobDate = parseISO(dateOfBirth)
  return differenceInYears(referenceDate, dobDate) >= 18
}

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const visitDateAndTime = ({
  startTimestamp,
  endTimestamp,
}: {
  startTimestamp: string
  endTimestamp: string
}): string => {
  const startTime = format(parseISO(startTimestamp), 'h:mmaaa')
  const endTime = endTimestamp ? ` - ${format(parseISO(endTimestamp), 'h:mmaaa')}` : ''

  return `${prisonerDateTimePretty(startTimestamp)}<br>${startTime}${endTime}`
}

export const nextIepAdjustDate = (latestIepAdjustDate: string): string => {
  return format(addDays(parseISO(latestIepAdjustDate), 14), 'd MMMM yyyy')
}

export const nextPrivIepAdjustDate = (latestPrivIepAdjustDate: string): string => {
  return format(addMonths(startOfMonth(parseISO(latestPrivIepAdjustDate)), 1), 'd MMMM yyyy')
}

export const formatVisitType = (visitType: string): string => properCase(visitType)

export const sortByTimestamp = (
  a: { visitTime: string; sortField: string },
  b: { visitTime: string; sortField: string },
) => {
  if (a.sortField > b.sortField) {
    return 1
  }
  if (a.sortField < b.sortField) {
    return -1
  }

  return 0
}

export function safeReturnUrl(originalUrl: string) {
  return originalUrl.length === 0 || originalUrl.indexOf('://') > 0 || originalUrl.indexOf('//') === 0
    ? '/'
    : originalUrl
}
