import validateForm from './searchForPrisonerValidation'

describe('validateForm', () => {
  describe('search', () => {
    it('valid', () => {
      expect(validateForm('abcd')).toBeNull()
    })
    it('tooShort', () => {
      expect(validateForm('ab')).toStrictEqual({
        href: '#search',
        text: 'You must enter at least 3 characters',
      })
    })
  })
})
