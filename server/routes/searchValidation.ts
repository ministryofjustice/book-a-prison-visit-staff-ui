type Error = {
  href: string
  text: string
}

const errors: { [key: string]: Error } = {
  INVALID_PRISONER_QUERY: {
    href: '#search',
    text: 'You must enter at least 3 characters',
  },
  INVALID_VISIT_QUERY: {
    href: '#searchBlock1',
    text: 'Please enter only alphanumeric characters in each search box',
  },
}

export const validatePrisonerSearch = (search: string): Error | null => {
  if (search.length < 3) {
    return errors.INVALID_PRISONER_QUERY
  }

  return null
}

export const validateVisitSearch = (reference: string): Error | null => {
  const visitReferenceRegExp = /^[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}$/
  const matches = reference.match(visitReferenceRegExp)

  if (matches === null) {
    return errors.INVALID_VISIT_QUERY
  }

  return null
}
