import { isValidVisitReference } from './validationChecks'

type Error = {
  param: string
  msg: string
}

const errors: { [key: string]: Error } = {
  INVALID_PRISONER_QUERY: {
    param: '#search',
    msg: 'You must enter at least 2 characters',
  },
  INVALID_VISIT_QUERY: {
    param: '#searchBlock1',
    msg: 'Booking reference must only include lower case letters',
  },
  SHORT_VISIT_QUERY: {
    param: '#searchBlock1',
    msg: 'Booking reference must be 8 characters',
  },
}

export const validatePrisonerSearch = (search: string): Error | null => {
  if (search.length < 2) {
    return errors.INVALID_PRISONER_QUERY
  }

  return null
}

export const validateVisitSearch = (reference: string): Error | null => {
  const referenceParts = reference.split('-')

  if (
    referenceParts.length === 4 &&
    referenceParts[0] === 'undefined' &&
    referenceParts[1] === 'undefined' &&
    referenceParts[2] === 'undefined' &&
    referenceParts[3] === 'undefined'
  ) {
    return errors.SHORT_VISIT_QUERY
  }

  if (referenceParts.join('').length < 8) {
    return errors.SHORT_VISIT_QUERY
  }

  if (!isValidVisitReference(reference)) {
    return errors.INVALID_VISIT_QUERY
  }

  return null
}
