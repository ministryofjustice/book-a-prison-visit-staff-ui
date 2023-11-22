export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const extractPrisonerNumber = (search: string): string | false => {
  const searchTerms = search.toUpperCase().split(' ')
  return searchTerms.find(term => isValidPrisonerNumber(term)) || false
}

export const isValidVisitReference = (reference: string): boolean => {
  const matches = reference.match(/^[a-z]{2}-[a-z]{2}-[a-z]{2}-[a-z]{2}$/)

  return matches !== null
}
