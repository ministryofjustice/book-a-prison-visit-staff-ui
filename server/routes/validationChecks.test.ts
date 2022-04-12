import { isValidPrisonerNumber, isValidVisitReference } from './validationChecks'

describe('isValidPrisonerNumber', () => {
  it('valid', () => {
    expect(isValidPrisonerNumber('A1234BC')).toEqual(true)
  })
  it('invalid', () => {
    expect(isValidPrisonerNumber('AB1234C')).toEqual(false)
  })
  it('empty string', () => {
    expect(isValidPrisonerNumber('')).toEqual(false)
  })
  it('disallowed characters', () => {
    expect(isValidPrisonerNumber(' A1234BC-')).toEqual(false)
  })
  it('wrong case', () => {
    expect(isValidPrisonerNumber('A1234bC')).toEqual(false)
  })
})

describe('isValidVisitReference', () => {
  it('valid', () => {
    expect(isValidVisitReference('aa-bb-cc-dd')).toEqual(true)
  })
  it('invalid', () => {
    expect(isValidVisitReference('addfewf')).toEqual(false)
  })
  it('empty string', () => {
    expect(isValidVisitReference('')).toEqual(false)
  })
})
