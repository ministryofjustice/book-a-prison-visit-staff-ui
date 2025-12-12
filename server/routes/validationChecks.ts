const BOOKER_REFERENCE_REGEX = /^[a-z]{4}-[a-z]{4}-[a-z]{4}$/

const PRISON_NUMBER_REGEX = /^[A-Z][0-9]{4}[A-Z]{2}$/

const VISIT_REFERENCE_REGEX = /^[a-z]{2}-[a-z]{2}-[a-z]{2}-[a-z]{2}$/

const VISITOR_REQUEST_REFERENCE_REGEX = /^[a-z]{4}-[a-z]{4}-[a-z]{4}$/

export const isValidBookerReference = (reference: string): boolean => {
  const matches = reference.match(BOOKER_REFERENCE_REGEX)
  return matches !== null
}

export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const matches = prisonerNo.match(PRISON_NUMBER_REGEX)
  return matches !== null
}

export const extractPrisonerNumber = (search: string): string | false => {
  const searchTerms = search.toUpperCase().split(' ')
  return searchTerms.find(term => isValidPrisonerNumber(term)) || false
}

export const isValidVisitReference = (reference: string): boolean => {
  const matches = reference.match(VISIT_REFERENCE_REGEX)
  return matches !== null
}

export const isValidVisitorRequestReference = (reference: string): boolean => {
  const matches = reference.match(VISITOR_REQUEST_REFERENCE_REGEX)
  return matches !== null
}
