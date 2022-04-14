export const validVisitReferenceCharacters = [
  'c',
  'f',
  'h',
  'u',
  'i',
  't',
  'z',
  'a',
  'l',
  'y',
  'x',
  'm',
  'q',
  'r',
  'b',
  'o',
  'd',
  's',
  'n',
  'p',
  'e',
  'g',
  'j',
  'v',
  'w',
  'k',
].join('')

export const isValidPrisonerNumber = (prisonerNo: string): boolean => {
  const prisonerNoRegExp = /^[A-Z][0-9]{4}[A-Z]{2}$/
  const matches = prisonerNo.match(prisonerNoRegExp)
  return matches !== null
}

export const isValidVisitReference = (reference: string): boolean => {
  const visitReferenceRegExp = new RegExp(
    `^[${validVisitReferenceCharacters}]{2}-[${validVisitReferenceCharacters}]{2}-[${validVisitReferenceCharacters}]{2}-[${validVisitReferenceCharacters}]{2}$`,
    'gi'
  )
  const matches = reference.match(visitReferenceRegExp)

  return matches !== null
}
