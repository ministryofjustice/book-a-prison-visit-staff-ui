import { VisitsPageSideNav } from '../@types/bapv'
import { SessionSchedule, VisitPreview, VisitRestriction } from '../data/orchestrationApiTypes'
import TestData from './testutils/testData'
import { getDateTabs, getSelectedOrDefaultSession, getSessionsSideNav } from './visitsUtils'

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

describe('getSelectedOrDefaultSession', () => {
  it('should return null if session schedule empty', () => {
    const sessionSchedule: SessionSchedule[] = []
    const sessionReference = 'reference'
    const type: VisitRestriction = 'OPEN'

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toBe(null)
  })

  // UNKNOWN not supported yet
  it('should return null if UNKNOWN visit type selected', () => {
    const sessionSchedule: SessionSchedule[] = []
    const sessionReference = 'reference'
    const type: VisitRestriction = 'UNKNOWN'

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toBe(null)
  })

  it('should default to the first session with capacity (open)', () => {
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
    const sessionReference: string = undefined
    const type: VisitRestriction = undefined

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toStrictEqual({
      sessionReference: '2',
      type: 'OPEN',
      times: '2pm to 4:30pm',
      capacity: 10,
    })
  })

  it('should default to the first session with capacity (no open; only closed)', () => {
    const sessionSchedule: SessionSchedule[] = [
      TestData.sessionSchedule({
        sessionTemplateReference: '1',
        sessionTimeSlot: { startTime: '09:00', endTime: '10:30' },
        capacity: { open: 0, closed: 5 },
      }),
    ]
    const sessionReference: string = undefined
    const type: VisitRestriction = undefined

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toStrictEqual({
      sessionReference: '1',
      type: 'CLOSED',
      times: '9am to 10:30am',
      capacity: 5,
    })
  })

  it('should return selected session and type if present', () => {
    const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]
    const sessionReference: string = sessionSchedule[0].sessionTemplateReference
    const type: VisitRestriction = 'OPEN'

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toStrictEqual({
      sessionReference: sessionSchedule[0].sessionTemplateReference,
      type: 'OPEN',
      times: '1:45pm to 3:45pm',
      capacity: 40,
    })
  })

  it('should return default if invalid session selected', () => {
    const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]
    const sessionReference: string = 'invalid reference'
    const type: VisitRestriction = 'OPEN'

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toStrictEqual({
      sessionReference: sessionSchedule[0].sessionTemplateReference,
      type: 'OPEN',
      times: '1:45pm to 3:45pm',
      capacity: 40,
    })
  })

  it('should return default if invalid type (because of zero capacity) selected', () => {
    const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]
    const sessionReference: string = sessionSchedule[0].sessionTemplateReference
    const type: VisitRestriction = 'CLOSED'

    const result = getSelectedOrDefaultSession(sessionSchedule, sessionReference, type)

    expect(result).toStrictEqual({
      sessionReference: sessionSchedule[0].sessionTemplateReference,
      type: 'OPEN',
      times: '1:45pm to 3:45pm',
      capacity: 40,
    })
  })
})

describe('getSessionsSideNav', () => {
  const selectedDate = '2024-01-29'
  const firstTabDate = '2024-01-29'

  describe('open & closed visits (these have a session template)', () => {
    it('should handle empty session schedule', () => {
      const sessionSchedule: SessionSchedule[] = []
      const unknownVisits: VisitPreview[] = []
      const expectedResult: VisitsPageSideNav = {}

      const result = getSessionsSideNav(sessionSchedule, unknownVisits, selectedDate, firstTabDate, '', 'OPEN')

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build side nav data for an open only session', () => {
      const sessionSchedule = [
        TestData.sessionSchedule({
          capacity: { open: 20, closed: 0 },
          sessionTimeSlot: { startTime: '10:00', endTime: '14:30' },
        }),
      ]
      const unknownVisits: VisitPreview[] = []

      const expectedResult: VisitsPageSideNav = {
        open: [
          {
            times: '10am to 2:30pm',
            reference: sessionSchedule[0].sessionTemplateReference,
            capacity: 20,
            queryParams: `type=OPEN&sessionReference=${sessionSchedule[0].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: true,
          },
        ],
      }

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        sessionSchedule[0].sessionTemplateReference,
        'OPEN',
      )

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build side nav data for a closed only session', () => {
      const sessionSchedule = [
        TestData.sessionSchedule({
          capacity: { open: 0, closed: 20 },
          sessionTimeSlot: { startTime: '10:00', endTime: '14:30' },
        }),
      ]
      const unknownVisits: VisitPreview[] = []

      const expectedResult: VisitsPageSideNav = {
        closed: [
          {
            times: '10am to 2:30pm',
            reference: sessionSchedule[0].sessionTemplateReference,
            capacity: 20,
            queryParams: `type=CLOSED&sessionReference=${sessionSchedule[0].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: true,
          },
        ],
      }

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        sessionSchedule[0].sessionTemplateReference,
        'CLOSED',
      )

      expect(result).toStrictEqual(expectedResult)
    })

    it('should build side nav data for mixed open and closed sessions', () => {
      const sessionSchedule = [
        TestData.sessionSchedule({
          capacity: { open: 20, closed: 0 },
          sessionTimeSlot: { startTime: '10:00', endTime: '14:30' },
        }),
        TestData.sessionSchedule({
          sessionTemplateReference: '-bfe.dcc.0f',
          capacity: { open: 15, closed: 10 },
          sessionTimeSlot: { startTime: '15:00', endTime: '16:00' },
        }),
        TestData.sessionSchedule({
          sessionTemplateReference: '-cfe.dcc.0f',
          capacity: { open: 0, closed: 5 },
          sessionTimeSlot: { startTime: '16:30', endTime: '18:00' },
        }),
      ]
      const unknownVisits: VisitPreview[] = []

      const expectedResult: VisitsPageSideNav = {
        open: [
          {
            times: '10am to 2:30pm',
            reference: sessionSchedule[0].sessionTemplateReference,
            capacity: 20,
            queryParams: `type=OPEN&sessionReference=${sessionSchedule[0].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: false,
          },
          {
            times: '3pm to 4pm',
            reference: sessionSchedule[1].sessionTemplateReference,
            capacity: 15,
            queryParams: `type=OPEN&sessionReference=${sessionSchedule[1].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: false,
          },
        ],
        closed: [
          {
            times: '3pm to 4pm',
            reference: sessionSchedule[1].sessionTemplateReference,
            capacity: 10,
            queryParams: `type=CLOSED&sessionReference=${sessionSchedule[1].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: true,
          },
          {
            times: '4:30pm to 6pm',
            reference: sessionSchedule[2].sessionTemplateReference,
            capacity: 5,
            queryParams: `type=CLOSED&sessionReference=${sessionSchedule[2].sessionTemplateReference}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: false,
          },
        ],
      }

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        sessionSchedule[1].sessionTemplateReference,
        'CLOSED',
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

      const expectedResult: VisitsPageSideNav = {
        unknown: [
          {
            times: '1:45pm to 4pm',
            reference: timeSlotReference,
            queryParams: `type=UNKNOWN&sessionReference=${encodeURIComponent(timeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: true,
          },
        ],
      }

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        timeSlotReference,
        'UNKNOWN',
      )

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

      const expectedResult: VisitsPageSideNav = {
        unknown: [
          {
            times: '10am to 11am',
            reference: firstTimeSlotReference,
            queryParams: `type=UNKNOWN&sessionReference=${encodeURIComponent(firstTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: true,
          },
          {
            times: '1:45pm to 4pm',
            reference: secondTimeSlotReference,
            queryParams: `type=UNKNOWN&sessionReference=${encodeURIComponent(secondTimeSlotReference)}&selectedDate=${selectedDate}&firstTabDate=${firstTabDate}`,
            active: false,
          },
        ],
      }

      const result = getSessionsSideNav(
        sessionSchedule,
        unknownVisits,
        selectedDate,
        firstTabDate,
        firstTimeSlotReference,
        'UNKNOWN',
      )

      expect(result).toStrictEqual(expectedResult)
    })
  })
})
