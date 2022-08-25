import { format } from 'date-fns'
import { getParsedDateFromQueryString, getDateTabs, getSlotsSideMenuData } from './visitsUtils'

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
  ].forEach(testData => {
    it(`should output ${testData.expected} when supplied with ${testData.input}`, () => {
      expect(getParsedDateFromQueryString(testData.input)).toBe(testData.expected)
    })
  })
})

describe('getDateTabs', () => {
  const todayString = '2022-05-24'
  const today = new Date(todayString)
  ;[
    {
      description: 'should list 3 tabs starting from the firstTab date, selecting the selected date',
      input: {
        selectedDate: '2022-05-22',
        firstTabDate: '2022-05-22',
        numberOfTabs: 3,
        defaultDate: today,
      },
      expected: [
        {
          text: 'Sunday 22 May 2022',
          href: `/visits?selectedDate=2022-05-22&firstTabDate=2022-05-22`,
          active: true,
        },
        {
          text: 'Monday 23 May 2022',
          href: `/visits?selectedDate=2022-05-23&firstTabDate=2022-05-22`,
          active: false,
        },
        {
          text: 'Tuesday 24 May 2022',
          href: `/visits?selectedDate=2022-05-24&firstTabDate=2022-05-22`,
          active: false,
        },
      ],
    },
    {
      description:
        'should list 3 tabs starting from the firstTab date, no date selected if selected date after 2 days later',
      input: {
        selectedDate: '2022-05-27',
        firstTabDate: '2022-05-22',
        numberOfTabs: 3,
        defaultDate: today,
      },
      expected: [
        {
          text: 'Sunday 22 May 2022',
          href: `/visits?selectedDate=2022-05-22&firstTabDate=2022-05-22`,
          active: false,
        },
        {
          text: 'Monday 23 May 2022',
          href: `/visits?selectedDate=2022-05-23&firstTabDate=2022-05-22`,
          active: false,
        },
        {
          text: 'Tuesday 24 May 2022',
          href: `/visits?selectedDate=2022-05-24&firstTabDate=2022-05-22`,
          active: false,
        },
      ],
    },
    {
      description:
        'should list 3 tabs starting from the firstTab date, defaulting to today as first tab if bad data passed for firstTabDate',
      input: {
        selectedDate: todayString,
        firstTabDate: '2022-35-22',
        numberOfTabs: 3,
        defaultDate: today,
      },
      expected: [
        {
          text: 'Tuesday 24 May 2022',
          href: `/visits?selectedDate=2022-05-24&firstTabDate=${todayString}`,
          active: true,
        },
        {
          text: 'Wednesday 25 May 2022',
          href: `/visits?selectedDate=2022-05-25&firstTabDate=${todayString}`,
          active: false,
        },
        {
          text: 'Thursday 26 May 2022',
          href: `/visits?selectedDate=2022-05-26&firstTabDate=${todayString}`,
          active: false,
        },
      ],
    },
  ].forEach(testData => {
    const {
      description,
      input: { selectedDate, firstTabDate, numberOfTabs, defaultDate },
      expected,
    } = testData

    it(description, () => {
      expect(getDateTabs(selectedDate, firstTabDate, numberOfTabs, defaultDate)).toStrictEqual(expected)
    })
  })
})

describe('getSlotsSideMenuData', () => {
  ;[
    {
      description: 'should return a single slot for a single session',
      input: {
        slotType: 'OPEN',
        slotFilter: '3pm to 3:59pm',
        selectedDate: '2022-05-24',
        firstTabDate: '2022-05-24',
        openSlots: [
          {
            visitTime: '3pm to 3:59pm',
            visitType: 'OPEN',
            sortField: '2022-05-24T15:00:00',
            adults: 1,
            children: 1,
          },
        ],
        closedSlots: [],
        unknownSlots: [],
      },
      expected: [
        {
          heading: {
            text: 'Open visits room',
            classes: 'govuk-!-padding-top-0',
          },
          items: [
            {
              text: '3pm to 3:59pm',
              href: '/visits?type=OPEN&time=3pm+to+3%3A59pm&selectedDate=2022-05-24&firstTabDate=2022-05-24',
              active: true,
            },
          ],
        },
      ],
    },
    {
      description: 'should return a multiple slots for multiple sessions',
      input: {
        slotType: 'OPEN',
        slotFilter: '10am to 11am',
        selectedDate: '2022-05-25',
        firstTabDate: '2022-05-25',
        openSlots: [
          {
            visitTime: '10am to 11am',
            visitType: 'OPEN',
            sortField: '2022-05-25T10:00:00',
            adults: 5,
            children: 1,
          },
          {
            visitTime: '2:15pm to 3pm',
            visitType: 'OPEN',
            sortField: '2022-05-25T14:15:00',
            adults: 2,
            children: 1,
          },
        ],
        closedSlots: [],
        unknownSlots: [],
      },
      expected: [
        {
          heading: {
            text: 'Open visits room',
            classes: 'govuk-!-padding-top-0',
          },
          items: [
            {
              text: '10am to 11am',
              href: '/visits?type=OPEN&time=10am+to+11am&selectedDate=2022-05-25&firstTabDate=2022-05-25',
              active: true,
            },
            {
              text: '2:15pm to 3pm',
              href: '/visits?type=OPEN&time=2%3A15pm+to+3pm&selectedDate=2022-05-25&firstTabDate=2022-05-25',
              active: false,
            },
          ],
        },
      ],
    },
  ].forEach(testData => {
    const { description, input, expected } = testData

    it(description, () => {
      expect(getSlotsSideMenuData(input)).toStrictEqual(expected)
    })
  })
})
