import {
  isValidPrisonerNumber,
  extractPrisonerNumber,
  isValidVisitReference,
  isValidBookerReference,
  isValidVisitorRequestReference,
  TEXT_INPUT_SINGLE_LINE_REGEX,
} from './validationChecks'

describe('textInputSingleLineRegex', () => {
  it.each([
    ['Valid input with letters and numbers', 'Hello World 123', true],
    ['Valid input with punctuation, symbols and currency', '!.? &()"\'[]{}- £$€', true],
    ['Valid input with accented characters', 'Café', true],
    ['Valid input (empty string)', '', true],

    ['Invalid input with non-Latin characters', 'Привет 你好', false],
    ['Invalid input with newline', 'Hello\nWorld', false],
    ['Invalid input with tab', 'Hello\tWorld', false],
    ['Invalid input with emoji', 'Hello 😊 World', false],
  ])('%s', (_: string, input: string, expected: boolean) => {
    const result = TEXT_INPUT_SINGLE_LINE_REGEX.test(input)
    expect(result).toBe(expected)
  })
})

describe('isValidBookerReference', () => {
  it('valid', () => {
    expect(isValidBookerReference('aaaa-bbbb-cccc')).toEqual(true)
  })
  it('invalid', () => {
    expect(isValidBookerReference('abc123')).toEqual(false)
  })
  it('empty string', () => {
    expect(isValidBookerReference('')).toEqual(false)
  })
})

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

describe('isValidVisitorRequestReference', () => {
  it('valid', () => {
    expect(isValidVisitorRequestReference('aaaa-bbbb-cccc')).toEqual(true)
  })
  it('invalid', () => {
    expect(isValidVisitorRequestReference('abc123')).toEqual(false)
  })
  it('empty string', () => {
    expect(isValidVisitorRequestReference('')).toEqual(false)
  })
})
