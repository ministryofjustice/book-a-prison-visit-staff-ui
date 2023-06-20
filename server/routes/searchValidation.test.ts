import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'

describe('validatePrisonerSearch', () => {
  it('valid', () => {
    expect(validatePrisonerSearch('abcd')).toBeNull()
  })
  it('tooShort', () => {
    expect(validatePrisonerSearch('b')).toStrictEqual({
      path: 'search',
      type: 'field',
      msg: 'You must enter at least 2 characters',
    })
  })
})

describe('validateVisitSearch', () => {
  it('valid', () => {
    expect(validateVisitSearch('ab-cd-ef-gh')).toBeNull()
  })
  it('empty', () => {
    expect(validateVisitSearch('')).toStrictEqual({
      path: 'searchBlock1',
      type: 'field',
      msg: 'Booking reference must be 8 characters',
    })
  })
  it('short', () => {
    expect(validateVisitSearch('sd-fs-df-f')).toStrictEqual({
      path: 'searchBlock1',
      type: 'field',
      msg: 'Booking reference must be 8 characters',
    })
  })
  it('invalid', () => {
    expect(validateVisitSearch('sd-lf-s1-ff')).toStrictEqual({
      path: 'searchBlock1',
      type: 'field',
      msg: 'Booking reference must only include lower case letters',
    })
  })
})
