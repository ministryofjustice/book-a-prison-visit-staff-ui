import { validatePrisonerSearch, validateVisitSearch } from './searchValidation'

describe('validatePrisonerSearch', () => {
  it('valid', () => {
    expect(validatePrisonerSearch('abcd')).toBeNull()
  })
  it('tooShort', () => {
    expect(validatePrisonerSearch('ab')).toStrictEqual({
      href: '#search',
      text: 'You must enter at least 3 characters',
    })
  })
})

describe('validateVisitSearch', () => {
  it('valid', () => {
    expect(validateVisitSearch('ab-cd-ef-gh')).toBeNull()
  })
  it('empty', () => {
    expect(validateVisitSearch('')).toStrictEqual({
      href: '#searchBlock1',
      text: 'Please enter only alphanumeric characters in each search box',
    })
  })
  it('invalid', () => {
    expect(validateVisitSearch('sdfsdff')).toStrictEqual({
      href: '#searchBlock1',
      text: 'Please enter only alphanumeric characters in each search box',
    })
  })
})
