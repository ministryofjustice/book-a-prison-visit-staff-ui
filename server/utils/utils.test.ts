import { convertToTitleCase, getPageLinks, isAdult } from './utils'
import getPageLinksTestData from './utils.testData'

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
  getPageLinksTestData.forEach(testData => {
    it(testData.description, () => {
      expect(getPageLinks(testData.params)).toEqual(testData.result)
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
