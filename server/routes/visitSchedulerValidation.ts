export default function isValidVisitReference(reference: string): boolean {
  const visitReferenceRegExp = /^[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}$/
  const matches = reference.match(visitReferenceRegExp)
  return matches !== null
}
