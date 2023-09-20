export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const extractPrisonerNumber = (search: string): string | boolean => {
  const prisonerNoRegExp = /[A-Z][0-9]{4}[A-Z]{2}/
  const matches = search.toUpperCase().match(prisonerNoRegExp)
  return matches ? matches[0] : false
}

export const isValidVisitReference = (reference: string): boolean => {
  const matches = reference.match(/^[a-z]{2}-[a-z]{2}-[a-z]{2}-[a-z]{2}$/)

  return matches !== null
}
