import { validatePrisonerSearch } from './searchValidation'

describe('validatePrisonerSearch', () => {
  describe('search', () => {
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
})
