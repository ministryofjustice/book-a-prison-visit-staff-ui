import { isValidPrisonerNumber, extractPrisonerNumber, isValidVisitReference } from './validationChecks'

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

describe('extractPrisonerNumber', () => {
  it.each([
    ['valid prisoner number', 'A1234BC', 'A1234BC'],
    ['valid prisoner number (lowercase)', 'a1234bc', 'A1234BC'],
    ['valid prisoner number (within string)', 'name A1234BC name', 'A1234BC'],
    ['do not match a sub-string', 'nameA1234BCname', false],
    ['empty string', '', false],
    ['empty string', '', false],
    ['disallowed characters', 'A123-4BC', false],
    ['wrong format', '1ABCD23', false],
  ])('%s: extractPrisonerNumber(%s) => %s', (_: string, input: string, expected: string | false) => {
    expect(extractPrisonerNumber(input)).toEqual(expected)
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
