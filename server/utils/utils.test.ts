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
  isSameVisitSlot,
  initialiseName,
  sortItemsByDateAsc,
} from './utils'
import getResultsPagingLinksTestData from './utils.testData'
import { VisitSlot } from '../@types/bapv'

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

describe('isSameVisitSlot', () => {
  ;[
    {
      // Matches
      sessionSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      originalVisitSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      expected: true,
    },
    {
      // Incorrect sessionTemplateReference
      sessionSlot: {
        sessionTemplateReference: 'gh-ef-cd-ab',
        startTimestamp: '2020-01-01T10:00:00',
      },
      originalVisitSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      expected: false,
    },
    {
      // Incorrect startTimestamp(time)
      sessionSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T14:00:00',
      },
      originalVisitSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      expected: false,
    },
    {
      // Incorrect startTimestamp(date)
      sessionSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2021-01-01T10:00:00',
      },
      originalVisitSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      expected: false,
    },
    {
      // Incorrect sessionTemplateReference and startTimestamp
      sessionSlot: {
        sessionTemplateReference: 'gh-ef-cd-ab',
        startTimestamp: '2021-01-01T10:00:00',
      },
      originalVisitSlot: {
        sessionTemplateReference: 'ab-cd-ef-gh',
        startTimestamp: '2020-01-01T10:00:00',
      },
      expected: false,
    },
  ].forEach(testData => {
    it(`should output ${testData.expected} when supplied with ${testData.sessionSlot.sessionTemplateReference} ${testData.sessionSlot.startTimestamp} and ${testData.originalVisitSlot.sessionTemplateReference} ${testData.originalVisitSlot.startTimestamp}`, () => {
      expect(isSameVisitSlot(testData.sessionSlot as VisitSlot, testData.originalVisitSlot as VisitSlot)).toBe(
        testData.expected,
      )
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

describe('sortItemsByDateAsc', () => {
  type Item = { date: string }

  it('should sort objects in place by ascending date order, given object type and field containing date strings', () => {
    const firstDate: Item = { date: '2025-01-01' }
    const nextDate: Item = { date: '2025-02-01' }
    const lastDate: Item = { date: '2025-03-01' }
    const emptyDate: Item = { date: '' }
    const invalidDate: Item = { date: 'not a date' }
    const undefinedDate: Item = { date: undefined }
    const wrongTypeDate = { date: [1] } as unknown as Item

    const items: Item[] = [emptyDate, invalidDate, undefinedDate, wrongTypeDate, lastDate, nextDate, firstDate]

    const result = sortItemsByDateAsc<Item, 'date'>(items, 'date')

    expect(result).toStrictEqual([firstDate, nextDate, lastDate, emptyDate, invalidDate, undefinedDate, wrongTypeDate])
  })
})
