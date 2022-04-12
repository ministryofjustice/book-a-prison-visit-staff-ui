export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const isValidVisitReference = (reference: string): boolean => {
  const visitReferenceRegExp = /^[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}$/
  const matches = reference.match(visitReferenceRegExp)

  return matches !== null
}
