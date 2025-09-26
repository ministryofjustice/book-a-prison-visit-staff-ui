import { format } from 'date-fns'
import {
  convertToTitleCase,
  getResultsPagingLinks,
  isAdult,
  prisonerDateTimePretty,
  properCaseFullName,
  properCase,
  safeReturnUrl,
  getParsedDateFromQueryString,
  getWeekOfDatesStartingMonday,
  initialiseName,
  isMobilePhoneNumber,
  formatStartToEndTime,
} from './utils'
import getResultsPagingLinksTestData from './utils.testData'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
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

describe('safeReturnUrl', () => {
  ;[
    {
      input: '',
      expected: '/',
    },
    {
      input: '/',
      expected: '/',
    },
    {
      input: '//unsafe/url',
      expected: '/',
    },
    {
      input: '/safe',
      expected: '/safe',
    },
    {
      input: '/safe/url',
      expected: '/safe/url',
    },
  ].forEach(testData => {
    it(`should output ${testData.expected} when supplied with ${testData.input}`, () => {
      expect(safeReturnUrl(testData.input)).toBe(testData.expected)
    })
  })
})

describe('getParsedDateFromQueryString', () => {
  const today = format(new Date(), 'yyyy-MM-dd')

  ;[
    {
      input: '2022-05-22',
      expected: '2022-05-22',
    },
    {
      input: '2222-00-12',
      expected: today,
    },
    {
      input: '!&"-bad-input',
      expected: today,
    },
  ].forEach(testData => {
    it(`should output ${testData.expected} when supplied with ${testData.input}`, () => {
      expect(getParsedDateFromQueryString(testData.input)).toBe(testData.expected)
    })
  })
})

describe('getWeekOfDatesStartingMonday', () => {
  const weekOfDates = {
    weekOfDates: ['2022-12-26', '2022-12-27', '2022-12-28', '2022-12-29', '2022-12-30', '2022-12-31', '2023-01-01'],
    previousWeek: '2022-12-19',
    nextWeek: '2023-01-02',
  }

  it('should return a week of dates starting on the given date when it is a Monday', () => {
    expect(getWeekOfDatesStartingMonday('2022-12-26')).toStrictEqual(weekOfDates)
  })

  it('should return a week of dates starting on the previous closest Monday when given a Wednesday', () => {
    expect(getWeekOfDatesStartingMonday('2022-12-28')).toStrictEqual(weekOfDates)
  })

  it('should return a week of dates starting on the previous closest Monday when given a Sunday', () => {
    expect(getWeekOfDatesStartingMonday('2023-01-01')).toStrictEqual(weekOfDates)
  })

  it('should return an empty array if given an invalid date', () => {
    expect(getWeekOfDatesStartingMonday('NOT A DATE')).toStrictEqual({
      weekOfDates: [],
      previousWeek: '',
      nextWeek: '',
    })
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('isMobilePhoneNumber', () => {
  it.each([
    ['non-mobile number', '01234567890', false],
    ['valid mobile number', '07712000000', true],
    ['valid mobile number (with spaces)', '07712 000 000', true],
    ['valid mobile number (with int. code)', '+447712 000000', true],
    ['empty string', '', false],
    ['invalid string', 'not a number', false],
    ['undefined number', undefined, false],
  ])('%s - %s - %s', (_: string, number: string, expected: boolean) => {
    expect(isMobilePhoneNumber(number)).toBe(expected)
  })
})

describe('formatStartToEndTime', () => {
  it.each([
    ['10:00', '11:00', '10am to 11am'],
    ['10:30', '12:45', '10:30am to 12:45pm'],
    ['13:00', '14:00', '1pm to 2pm'],
    ['13:15', '14:30', '1:15pm to 2:30pm'],
    ['23:00', '00:00', '11pm to 12am'],
    ['', '', ''],
    [undefined, undefined, ''],
  ])('%s - %s - %s', (startTime: string, endTime: string, expected: string) => {
    expect(formatStartToEndTime(startTime, endTime)).toBe(expected)
  })
})
