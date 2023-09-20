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
  it('valid', () => {
    expect(extractPrisonerNumber('A1234BC')).toEqual('A1234BC')
  })
  it('valid - extra characters', () => {
    expect(extractPrisonerNumber('name A1234BC ssea')).toEqual('A1234BC')
  })
  it('empty string', () => {
    expect(extractPrisonerNumber('')).toEqual(false)
  })
  it('disallowed characters', () => {
    expect(extractPrisonerNumber('A123-4BC')).toEqual(false)
  })
  it('wrong format', () => {
    expect(extractPrisonerNumber('1ABCD23')).toEqual(false)
  })
  it('lowercase', () => {
    expect(extractPrisonerNumber('a1234bc')).toEqual('A1234BC')
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
