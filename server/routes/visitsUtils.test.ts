import { VisitsPageSideNav } from '../@types/bapv'
import { SessionSchedule, VisitPreview } from '../data/orchestrationApiTypes'
import TestData from './testutils/testData'
import { getDateTabs, getSelectedOrDefaultSessionSchedule, getSessionsSideNav } from './visitsUtils'

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

describe('getSelectedOrDefaultSessionSchedule', () => {
  const sessionSchedule: SessionSchedule[] = [
    TestData.sessionSchedule({
      sessionTemplateReference: '1',
      sessionTimeSlot: { startTime: '09:00', endTime: '10:30' },
      capacity: { open: 0, closed: 5 },
    }),
    TestData.sessionSchedule({
      sessionTemplateReference: '2',
      sessionTimeSlot: { startTime: '14:00', endTime: '16:30' },
      capacity: { open: 10, closed: 3 },
    }),
  ]
  describe('with unknown visits not present', () => {
    it('should return null if session schedule empty', () => {
      const result = getSelectedOrDefaultSessionSchedule([], '', [])
      expect(result).toBe(null)
    })

    it('should default to the first session schedule', () => {
      const sessionReference: string = undefined
      const result = getSelectedOrDefaultSessionSchedule(sessionSchedule, sessionReference, [])
      expect(result).toStrictEqual(sessionSchedule[0])
    })

    it('should return selected session schedule if present', () => {
      const sessionReference: string = sessionSchedule[1].sessionTemplateReference
      const result = getSelectedOrDefaultSessionSchedule(sessionSchedule, sessionReference, [])
      expect(result).toStrictEqual(sessionSchedule[1])
    })

    it('should return default if invalid session reference given', () => {
      const sessionReference: string = 'invalid reference'
      const result = getSelectedOrDefaultSessionSchedule(sessionSchedule, sessionReference, [])
      expect(result).toStrictEqual(sessionSchedule[0])
    })
  })

  describe('with unknown visits present', () => {
    const unknownVisits = [
      TestData.visitPreview({ visitTimeSlot: { startTime: '09:00', endTime: '10:00' } }),
      TestData.visitPreview({ visitTimeSlot: { startTime: '10:00', endTime: '11:00' } }),
    ]

    it('should return null if reference matches an unknown visit time slot - empty session schedule', () => {
      const result = getSelectedOrDefaultSessionSchedule([], '09:00-10:00', unknownVisits)
      expect(result).toBe(null)
    })

    it('should return null if reference does not match an unknown visit time slot - empty session schedule', () => {
      const result = getSelectedOrDefaultSessionSchedule([], 'invalid-time-slot', unknownVisits)
      expect(result).toBe(null)
    })

    it('should return null if reference matches an unknown visit time slot - with a session schedule', () => {
      const result = getSelectedOrDefaultSessionSchedule(sessionSchedule, '09:00-10:00', unknownVisits)
      expect(result).toBe(null)
    })

    it('should return to default of first session schedule if reference does not match an unknown visit time slot - with a session schedule', () => {
      const result = getSelectedOrDefaultSessionSchedule(sessionSchedule, 'invalid-time-slot', unknownVisits)
      expect(result).toStrictEqual(sessionSchedule[0])
    })
  })
})

describe('getSessionsSideNav', () => {
  const selectedDate = '2024-01-29'
  const firstTabDate = '2024-01-29'

  describe('visits with a session template', () => {
    it('should handle empty session schedule', () => {
      const sessionSchedule: SessionSchedule[] = []
      const unknownVisits: VisitPreview[] = []
      const expectedResult: VisitsPageSideNav = new Map()

      const result = getSessionsSideNav(sessionSchedule, unknownVisits, selectedDate, firstTabDate, '')

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build side nav data for a single session - single visit room', () => {
      const sessionSchedule = [TestData.sessionSchedule()]
      const unknownVisits: VisitPreview[] = []

      const expectedResult: VisitsPageSideNav = new Map([
        [
          'Visits hall',
          [
            {
              times: '1:45pm to 3:45pm',
              reference: sessionSchedule[0].sessionTemplateReference,
              queryParams: `sessionReference=${sessionSchedule[0].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: true,
            },
          ],
        ],
      ])

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        sessionSchedule[0].sessionTemplateReference,
      )

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build side nav data for multiple sessions - two visit rooms', () => {
      const sessionSchedule = [
        TestData.sessionSchedule({ sessionTemplateReference: 'a' }),
        TestData.sessionSchedule({
          sessionTemplateReference: 'b',
          sessionTimeSlot: { startTime: '16:00', endTime: '17:00' },
        }),
        TestData.sessionSchedule({
          sessionTemplateReference: 'c',
          sessionTimeSlot: { startTime: '09:00', endTime: '10:00' },
          visitRoom: 'Visits hall 2',
        }),
      ]
      const unknownVisits: VisitPreview[] = []

      const expectedResult: VisitsPageSideNav = new Map([
        [
          'Visits hall',
          [
            {
              times: '1:45pm to 3:45pm',
              reference: sessionSchedule[0].sessionTemplateReference,
              queryParams: `sessionReference=${sessionSchedule[0].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: false,
            },
            {
              times: '4pm to 5pm',
              reference: sessionSchedule[1].sessionTemplateReference,
              queryParams: `sessionReference=${sessionSchedule[1].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: false,
            },
          ],
        ],
        [
          'Visits hall 2',
          [
            {
              times: '9am to 10am',
              reference: sessionSchedule[2].sessionTemplateReference,
              queryParams: `sessionReference=${sessionSchedule[2].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: true,
            },
          ],
        ],
      ])

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        sessionSchedule[2].sessionTemplateReference,
      )

      expect(result).toStrictEqual(expectedResult)
    })
  })

  describe('unknown visits (those with no session template)', () => {
    it('should build one side nav entry for multiple visits with same times', () => {
      const sessionSchedule: SessionSchedule[] = []
      const visitTimeSlot = { startTime: '13:45', endTime: '16:00' }
      const timeSlotReference = '13:45-16:00'
      const unknownVisits: VisitPreview[] = [
        TestData.visitPreview({ visitTimeSlot }),
        TestData.visitPreview({ visitTimeSlot }),
      ]

      const expectedResult: VisitsPageSideNav = new Map([
        [
          'All visits',
          [
            {
              times: '1:45pm to 4pm',
              reference: timeSlotReference,
              queryParams: `sessionReference=${encodeURIComponent(timeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: true,
            },
          ],
        ],
      ])

      const result = getSessionsSideNav(sessionSchedule, unknownVisits, selectedDate, firstTabDate, timeSlotReference)

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build two side nav entries ordered by start time for visits with different times', () => {
      const sessionSchedule: SessionSchedule[] = []
      const firstVisitTimeSlot = { startTime: '10:00', endTime: '11:00' }
      const firstTimeSlotReference = '10:00-11:00'
      const secondVisitTimeSlot = { startTime: '13:45', endTime: '16:00' }
      const secondTimeSlotReference = '13:45-16:00'
      const unknownVisits: VisitPreview[] = [
        TestData.visitPreview({ visitTimeSlot: secondVisitTimeSlot }),
        TestData.visitPreview({ visitTimeSlot: firstVisitTimeSlot }),
      ]

      const expectedResult: VisitsPageSideNav = new Map([
        [
          'All visits',
          [
            {
              times: '10am to 11am',
              reference: firstTimeSlotReference,
              queryParams: `sessionReference=${encodeURIComponent(firstTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: true,
            },
            {
              times: '1:45pm to 4pm',
              reference: secondTimeSlotReference,
              queryParams: `sessionReference=${encodeURIComponent(secondTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: false,
            },
          ],
        ],
      ])

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        firstTimeSlotReference,
      )

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build two side nav entries and select the first by default if no other sessions present and no query params set', () => {
      const sessionSchedule: SessionSchedule[] = []
      const firstVisitTimeSlot = { startTime: '10:00', endTime: '11:00' }
      const firstTimeSlotReference = '10:00-11:00'
      const secondVisitTimeSlot = { startTime: '13:45', endTime: '16:00' }
      const secondTimeSlotReference = '13:45-16:00'
      const unknownVisits: VisitPreview[] = [
        TestData.visitPreview({ visitTimeSlot: secondVisitTimeSlot }),
        TestData.visitPreview({ visitTimeSlot: firstVisitTimeSlot }),
      ]

      const expectedResult: VisitsPageSideNav = new Map([
        [
          'All visits',
          [
            {
              times: '10am to 11am',
              reference: firstTimeSlotReference,
              queryParams: `sessionReference=${encodeURIComponent(firstTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: true,
            },
            {
              times: '1:45pm to 4pm',
              reference: secondTimeSlotReference,
              queryParams: `sessionReference=${encodeURIComponent(secondTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
              active: false,
            },
          ],
        ],
      ])

      const result = getSessionsSideNav(sessionSchedule, unknownVisits, selectedDate, firstTabDate, '')

      expect(result).toStrictEqual(expectedResult)
    })
  })
})
