import { GOVUKTag } from '../@types/bapv'
import { VisitSession, SessionSchedule } from '../data/orchestrationApiTypes'
import TestData from '../routes/testutils/testData'
import VisitSessionsService, { CalendarDay } from './visitSessionsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'

const token = 'some token'
const username = 'user1'

describe('Visit sessions service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitSessionsService: VisitSessionsService

  const OrchestrationApiClientFactory = jest.fn()

  const prisonId = 'HEI'

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitSessionsService = new VisitSessionsService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSingleVisitSession', () => {
    it('should return requested VisitSession', async () => {
      const visitSession: VisitSession = TestData.visitSession()
      const sessionDate = visitSession.startTimestamp.split('T')[0]

      orchestrationApiClient.getSingleVisitSession.mockResolvedValue(visitSession)

      const results = await visitSessionsService.getSingleVisitSession({
        prisonCode: 'HEI',
        sessionDate,
        sessionTemplateReference: visitSession.sessionTemplateReference,
        username,
      })

      expect(orchestrationApiClient.getSingleVisitSession).toHaveBeenCalledWith(
        'HEI',
        sessionDate,
        visitSession.sessionTemplateReference,
      )
      expect(results).toEqual(visitSession)
    })
  })

  describe('getSessionSchedule', () => {
    it('should return an array of scheduled sessions for the specified prison and date', async () => {
      const date = '2023-02-01'
      const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]

      orchestrationApiClient.getSessionSchedule.mockResolvedValue(sessionSchedule)

      const results = await visitSessionsService.getSessionSchedule({ username, prisonId, date })

      expect(orchestrationApiClient.getSessionSchedule).toHaveBeenCalledWith(prisonId, date)
      expect(results).toEqual(sessionSchedule)
    })
  })

  describe('getVisitSessionCapacity', () => {
    it('should return the open and closed capacity for the specified visit session', async () => {
      const sessionCapacity = TestData.sessionCapacity()
      const sessionDate = '2023-01-31'
      const sessionStartTime = '10:00'
      const sessionEndTime = '11:00'

      orchestrationApiClient.getVisitSessionCapacity.mockResolvedValue(sessionCapacity)

      const results = await visitSessionsService.getVisitSessionCapacity(
        'user1',
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(orchestrationApiClient.getVisitSessionCapacity).toHaveBeenCalledWith(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )
      expect(results).toEqual(sessionCapacity)
    })
  })

  describe('getVisitSessionsAndScheduleCalendar', () => {
    const prisonerId = 'A1234BC'
    const minNumberOfDays = 2

    it('should return CalendarDay array with days, visit sessions and events correctly transformed from raw data', async () => {
      const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
        sessionsAndSchedule: [
          // no visit sessions
          TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [], scheduledEvents: [] }),

          // morning and afternoon visit sessions and events
          TestData.sessionsAndScheduleDto({
            date: '2025-09-01',
            visitSessions: [
              TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00', sessionTemplateReference: 'a' }),
              TestData.visitSessionV2({
                startTime: '13:00',
                endTime: '14:30',
                sessionTemplateReference: 'b',
                openVisitBookedCount: 5,
              }),
            ],
            scheduledEvents: [
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education 1' }),
              TestData.prisonerScheduledEvent({ startTime: '14:30', endTime: '16:00', eventSourceDesc: 'Education 2' }),
            ],
          }),
        ],
      })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const expectedCalendarDays: CalendarDay[] = [
        {
          date: '2025-08-31',
          monthHeading: 'August',
          selected: false,
          outline: false,
          visitSessions: [],
          scheduledEvents: [],
        },
        {
          date: '2025-09-01',
          monthHeading: 'September',
          selected: true, // first date with session and no selectedSession so defaults to true
          outline: false,
          visitSessions: [
            {
              date: '2025-09-01',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
            {
              date: '2025-09-01',
              sessionTemplateReference: 'b',
              daySection: 'afternoon',
              startTime: '13:00',
              endTime: '14:30',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 15,
              capacity: 20,
              sessionConflicts: [],
              disabled: false,
            },
          ],
          scheduledEvents: [
            {
              daySection: 'morning',
              startTime: '09:00',
              endTime: '11:00',
              description: 'Activity - Education 1',
            },
            {
              daySection: 'afternoon',
              startTime: '14:30',
              endTime: '16:00',
              description: 'Activity - Education 2',
            },
          ],
        },
      ]

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username,
        prisonId,
        prisonerId,
        minNumberOfDays,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
        originalVisitSession: undefined,
      })

      expect(result.calendar).toStrictEqual(expectedCalendarDays)
      expect(result.scheduledEventsAvailable).toBe(true)
    })

    it('should correctly format scheduled events based on event type', async () => {
      const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
        sessionsAndSchedule: [
          TestData.sessionsAndScheduleDto({
            scheduledEvents: [
              TestData.prisonerScheduledEvent({
                eventType: 'APP',
                eventSourceDesc: 'eventSourceDesc',
                eventSubTypeDesc: 'eventSubTypeDesc',
              }),
              TestData.prisonerScheduledEvent({
                eventType: 'VISIT',
                eventSourceDesc: 'eventSourceDesc',
                eventSubTypeDesc: 'eventSubTypeDesc',
              }),
              TestData.prisonerScheduledEvent({
                eventType: 'OTHER',
                eventSourceDesc: 'eventSourceDesc',
                eventSubTypeDesc: 'eventSubTypeDesc',
              }),
            ],
          }),
        ],
      })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username,
        prisonId,
        prisonerId,
        minNumberOfDays,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
        originalVisitSession: undefined,
      })

      expect(result.calendar[0].scheduledEvents[0].description).toBe('Appointment - eventSubTypeDesc')
      expect(result.calendar[0].scheduledEvents[1].description).toBe('Visit - eventSourceDesc')
      expect(result.calendar[0].scheduledEvents[2].description).toBe('Activity - eventSourceDesc')
    })

    it('should return scheduled events API availability flag', async () => {
      const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({ scheduledEventsAvailable: false })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username,
        prisonId,
        prisonerId,
        minNumberOfDays,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
        originalVisitSession: undefined,
      })

      expect(result.scheduledEventsAvailable).toBe(false)
    })

    describe('Visit restriction (OPEN / CLOSED) - session filtering and availability', () => {
      it('should exclude visit sessions with no capacity and calculate available tables - OPEN visit restriction', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            // no visit sessions with OPEN capacity - should not be included
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ openVisitCapacity: 0 })],
              scheduledEvents: [],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-09-01',
              visitSessions: [
                TestData.visitSessionV2({
                  sessionTemplateReference: 'a',
                  openVisitCapacity: 10,
                  openVisitBookedCount: 6,
                }),
              ],
              scheduledEvents: [],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const expectedCalendarDays: CalendarDay[] = [
          {
            date: '2025-08-31',
            monthHeading: 'August',
            selected: false,
            outline: false,
            visitSessions: [],
            scheduledEvents: [],
          },
          {
            date: '2025-09-01',
            monthHeading: 'September',
            selected: true,
            outline: false,
            visitSessions: [
              {
                date: '2025-09-01',
                sessionTemplateReference: 'a',
                daySection: 'morning',
                startTime: '10:00',
                endTime: '11:00',
                visitRoom: TestData.visitSessionV2().visitRoom,
                availableTables: 4,
                capacity: 10,
                sessionConflicts: [],
                disabled: false,
              },
            ],
            scheduledEvents: [],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar).toStrictEqual(expectedCalendarDays)
      })

      it('should exclude visit sessions with no capacity and calculate available tables - CLOSED visit restriction', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            // no visit sessions with CLOSED capacity - should not be included
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ closedVisitCapacity: 0 })],
              scheduledEvents: [],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-09-01',
              visitSessions: [
                TestData.visitSessionV2({
                  sessionTemplateReference: 'a',
                  closedVisitCapacity: 10,
                  closedVisitBookedCount: 6,
                }),
              ],
              scheduledEvents: [],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const expectedCalendarDays: CalendarDay[] = [
          {
            date: '2025-08-31',
            monthHeading: 'August',
            selected: false,
            outline: false,
            visitSessions: [],
            scheduledEvents: [],
          },
          {
            date: '2025-09-01',
            monthHeading: 'September',
            selected: true,
            outline: false,
            visitSessions: [
              {
                date: '2025-09-01',
                sessionTemplateReference: 'a',
                daySection: 'morning',
                startTime: '10:00',
                endTime: '11:00',
                visitRoom: TestData.visitSessionV2().visitRoom,
                availableTables: 4,
                capacity: 10,
                sessionConflicts: [],
                disabled: false,
              },
            ],
            scheduledEvents: [],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'CLOSED',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar).toStrictEqual(expectedCalendarDays)
      })
    })

    describe('Selected calendar grid day', () => {
      it('should select and outline grid day matching selectedVisitSession', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              date: '2025-08-30',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'a' })],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'b' })],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: '2025-08-31',
            sessionTemplateReference: 'b',
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: undefined,
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(false)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(true)
      })

      it('should default to selecting the first grid day with a visit session and outlining selectedVisitSession date if selectedVisitSession not found', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),
            TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [TestData.visitSessionV2()] }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: '2025-08-30',
            sessionTemplateReference: 'not found',
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: undefined,
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(true)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(false)
      })

      it('should default to selecting but NOT outlining the first grid day with a visit session if selectedVisitSession not set', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),
            TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [TestData.visitSessionV2()] }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(false)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(false)
      })
    })

    describe('Calendar grid day colour', () => {
      const availableVisitSession = TestData.visitSessionV2({ sessionTemplateReference: 'a' })
      const fullVisitSession = TestData.visitSessionV2({
        sessionTemplateReference: 'b',
        openVisitCapacity: 10,
        openVisitBookedCount: 10,
      })
      const visitSessionWithExistingVisit = TestData.visitSessionV2({
        sessionTemplateReference: 'c',
        sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
      })

      it('should be blue if there are no available visit sessions', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [TestData.sessionsAndScheduleDto({ visitSessions: [] })],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].colour).toBeUndefined() // blue is the default
      })

      it('should be blue if there is at least one available visit session', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [availableVisitSession, fullVisitSession, visitSessionWithExistingVisit],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].colour).toBeUndefined() // blue is the default
      })

      it('should be blue if selected or original visit session present', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              date: '2025-09-01',
              visitSessions: [fullVisitSession, visitSessionWithExistingVisit],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-09-02',
              visitSessions: [fullVisitSession, visitSessionWithExistingVisit],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: '2025-09-01',
            sessionTemplateReference: 'b',
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: {
            date: '2025-09-02',
            sessionTemplateReference: 'c',
            startTime: '',
            endTime: '',
            visitRestriction: 'OPEN',
          },
        })

        expect(result.calendar[0].colour).toBeUndefined() // blue is the default
        expect(result.calendar[1].colour).toBeUndefined() // blue is the default
      })

      it('should be orange if there is at least a fully booked visit session available', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [fullVisitSession, visitSessionWithExistingVisit],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].colour).toBe('orange')
      })

      it('should be red if there is only a visit session with an existing visit for the prisoner available', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [visitSessionWithExistingVisit],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].colour).toBe('red')
      })
    })

    describe('Original booking (update journey)', () => {
      it('should select and outline grid day and tag matching originalVisitSession if that visit session is present', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              date: '2025-08-30',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'a' })],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'b' })],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: {
            date: '2025-08-31',
            sessionTemplateReference: 'b',
            startTime: '',
            endTime: '',
            visitRestriction: 'OPEN',
          },
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(false)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(true)
        expect(result.calendar[1].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Original booking',
          classes: 'govuk-tag--light-blue',
        })
      })

      it('should outline day matching originalVisitSession if that session not present and default to selecting first day with a session', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              date: '2025-08-30',
              visitSessions: [],
            }),
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'b' })],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: {
            date: '2025-08-30',
            sessionTemplateReference: 'a',
            startTime: '',
            endTime: '',
            visitRestriction: 'OPEN',
          },
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(true)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(false)
      })

      it('should outline day matching originalVisitSession and outline and select selectedVisitSession', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            // original visit session
            TestData.sessionsAndScheduleDto({
              date: '2025-08-30',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'a' })],
            }),
            // selected visit session
            TestData.sessionsAndScheduleDto({
              date: '2025-08-31',
              visitSessions: [TestData.visitSessionV2({ sessionTemplateReference: 'b' })],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: '2025-08-31',
            sessionTemplateReference: 'b',
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: {
            date: '2025-08-30',
            sessionTemplateReference: 'a',
            startTime: '',
            endTime: '',
            visitRestriction: 'OPEN',
          },
        })

        expect(result.calendar.length).toBe(2)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(false)
        expect(result.calendar[0].outline).toBe(true)

        expect(result.calendar[1].colour).toBeUndefined()
        expect(result.calendar[1].selected).toBe(true)
        expect(result.calendar[1].outline).toBe(true)
      })
    })

    describe('Currently reserved visit session', () => {
      it('should select and outline grid day and tag the visit session matching the currently reserved visit session', async () => {
        const selectedVisitSession = TestData.visitSessionV2({ sessionTemplateReference: 'a' })
        const anotherVisitSession = TestData.visitSessionV2({ sessionTemplateReference: 'b' })

        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [selectedVisitSession, anotherVisitSession],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: visitSessionsAndSchedule.sessionsAndSchedule[0].date,
            sessionTemplateReference: selectedVisitSession.sessionTemplateReference,
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: undefined,
        })
        expect(result.calendar.length).toBe(1)

        expect(result.calendar[0].colour).toBeUndefined()
        expect(result.calendar[0].selected).toBe(true)
        expect(result.calendar[0].outline).toBe(true)
        expect(result.calendar[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Reserved visit time',
          classes: 'govuk-tag--light-blue',
        })
        expect(result.calendar[0].visitSessions[1].tag).toBeUndefined()
      })
    })

    describe('Visit session when prisoner already has a visit', () => {
      it('should tag and disable the visit session if prisoner already has a visit', async () => {
        const visitSessionWithExistingVisit = TestData.visitSessionV2({
          sessionTemplateReference: 'a',
          sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
        })
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [visitSessionWithExistingVisit],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].selected).toBe(true)
        expect(result.calendar[0].outline).toBe(false)
        expect(result.calendar[0].visitSessions[0].disabled).toBe(true)
        expect(result.calendar[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Prisoner has a visit',
          classes: 'govuk-tag--red',
        })
      })
    })

    describe('Fully booked visit session', () => {
      it('should tag visit session with no available tables', async () => {
        const fullVisitSession = TestData.visitSessionV2({ openVisitCapacity: 10, openVisitBookedCount: 10 })

        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [TestData.sessionsAndScheduleDto({ visitSessions: [fullVisitSession] })],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Fully booked',
          classes: 'govuk-tag--orange',
        })
      })
    })
  })
})
