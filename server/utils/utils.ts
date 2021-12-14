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

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export default convertToTitleCase
