type Error = {
  param: string
  msg: string
}

const errors: { [key: string]: Error } = {
  INVALID_PRISONER_QUERY: {
    param: '#search',
    msg: 'You must enter at least 3 characters',
  },
  INVALID_VISIT_QUERY: {
    param: '#searchBlock1',
    msg: 'Please enter only alphanumeric characters in each search box',
  },
  SHORT_VISIT_QUERY: {
    param: '#searchBlock1',
    msg: 'Booking reference must be 8 characters',
  },
}

export const validatePrisonerSearch = (search: string): Error | null => {
  if (search.length < 3) {
    return errors.INVALID_PRISONER_QUERY
  }

  return null
}

export const validateVisitSearch = (reference: string): Error | null => {
  if (reference.split('-').join('').length < 8) {
    return errors.SHORT_VISIT_QUERY
  }

  const visitReferenceRegExp = /^[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}-[a-z0-9]{2}$/
  const matches = reference.match(visitReferenceRegExp)

  if (matches === null) {
    return errors.INVALID_VISIT_QUERY
  }

  return null
}
