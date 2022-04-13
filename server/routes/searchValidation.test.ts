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
      msg: 'Please enter only alphanumeric characters in each search box',
    })
  })
  it('invalid', () => {
    expect(validateVisitSearch('sdfsdff')).toStrictEqual({
      param: '#searchBlock1',
      msg: 'Please enter only alphanumeric characters in each search box',
    })
  })
})
