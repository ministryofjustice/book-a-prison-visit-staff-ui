import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'

describe('validatePrisonerSearch', () => {
  it('valid', () => {
    expect(validatePrisonerSearch('abcd')).toBeNull()
  })
  it('tooShort', () => {
    expect(validatePrisonerSearch('ab')).toStrictEqual({
      param: '#search',
      msg: 'You must enter at least 3 characters',
    })
  })
})

describe('validateVisitSearch', () => {
  it('valid', () => {
    expect(validateVisitSearch('ab-cd-ef-gh')).toBeNull()
  })
  it('empty', () => {
    expect(validateVisitSearch('')).toStrictEqual({
      param: '#searchBlock1',
      msg: 'Booking reference must be 8 characters',
    })
  })
  it('short', () => {
    expect(validateVisitSearch('sd-fs-df-f')).toStrictEqual({
      param: '#searchBlock1',
      msg: 'Booking reference must be 8 characters',
    })
  })
  it('invalid', () => {
    expect(validateVisitSearch('sd-lf-s1-ff')).toStrictEqual({
      param: '#searchBlock1',
      msg: 'Booking reference must only include lower case letters',
    })
  })
})
