import {
  convertToTitleCase,
  getResultsPagingLinks,
  isAdult,
  prisonerDateTimePretty,
  properCaseFullName,
  properCase,
} from './utils'
import getResultsPagingLinksTestData from './utils.testData'

describe('Convert to title case', () => {
  it('null string', () => {
    expect(convertToTitleCase(null)).toEqual('')
  })
  it('empty string', () => {
    expect(convertToTitleCase('')).toEqual('')
  })
  it('Lower Case', () => {
    expect(convertToTitleCase('robert')).toEqual('Robert')
  })
  it('Upper Case', () => {
    expect(convertToTitleCase('ROBERT')).toEqual('Robert')
  })
  it('Mixed Case', () => {
    expect(convertToTitleCase('RoBErT')).toEqual('Robert')
  })
  it('Multiple words', () => {
    expect(convertToTitleCase('RobeRT SMiTH')).toEqual('Robert Smith')
  })
  it('Leading spaces', () => {
    expect(convertToTitleCase('  RobeRT')).toEqual('  Robert')
  })
  it('Trailing spaces', () => {
    expect(convertToTitleCase('RobeRT  ')).toEqual('Robert  ')
  })
  it('Hyphenated', () => {
    expect(convertToTitleCase('Robert-John SmiTH-jONes-WILSON')).toEqual('Robert-John Smith-Jones-Wilson')
  })
})

describe('Return pagination pages', () => {
  getResultsPagingLinksTestData.forEach(testData => {
    it(testData.description, () => {
      expect(getResultsPagingLinks(testData.params)).toEqual(testData.result)
    })
  })
})

describe('Check if adult', () => {
  it('Is an adult - now', () => {
    expect(isAdult('2000-01-01')).toEqual(true)
  })
  it('Is an adult - on given date', () => {
    expect(isAdult('2000-01-02', new Date(2018, 0, 2))).toEqual(true)
  })
  it('Is a child - on given date', () => {
    expect(isAdult('2000-01-02', new Date(2018, 0, 1))).toEqual(false)
  })
})

describe('prisonerDateTimePretty', () => {
  it('2022-03-17T10:00:00', () => {
    expect(prisonerDateTimePretty('2022-03-17T10:00:00')).toEqual('17 March 2022')
  })
})

describe('properCaseFullName', () => {
  it('my test data', () => {
    expect(properCaseFullName('my test data')).toEqual('My Test Data')
  })
  it('single character', () => {
    expect(properCaseFullName('s')).toEqual('S')
  })
  it('empty string', () => {
    expect(properCaseFullName('')).toEqual('')
  })
})

describe('properCase', () => {
  it('my test data', () => {
    expect(properCase('my test data')).toEqual('My test data')
  })
  it('single character', () => {
    expect(properCase('s')).toEqual('S')
  })
  it('empty string', () => {
    expect(properCase('')).toEqual('')
  })
})
