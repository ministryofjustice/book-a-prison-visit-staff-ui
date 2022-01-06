import { format, parse } from 'date-fns'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const prisonerDobPretty = (dateOfBirth: string): string => {
  return format(parse(dateOfBirth, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy')
}

export const properCaseFullName = (name: string): string =>
  isBlank(name)
    ? ''
    : name
        .split(/(\s+)/)
        .filter(s => s.trim().length)
        .map(properCaseName)
        .join(' ')

export const getPageLinks = ({
  pagesToShow = 1,
  numberOfPages = 1,
  currentPage = 1,
  searchTerm = '',
}: {
  pagesToShow: number
  numberOfPages: number
  currentPage: number
  searchTerm: string
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
      href: `/search/results?result=${searchTerm}&page=${pageIndex}`,
      selected: pageIndex === currentPage,
    })
  }

  return pageLinks
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

export default convertToTitleCase
