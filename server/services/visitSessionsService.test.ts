import { VisitSlotList } from '../@types/bapv'
import { VisitSession, SessionSchedule } from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import TestData from '../routes/testutils/testData'
import VisitSessionsService, { CalendarMonth, CalendarFullDay } from './visitSessionsService'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockWhereaboutsApiClient,
} from '../data/testutils/mocks'

const token = 'some token'

describe('Visit sessions service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const whereaboutsApiClient = createMockWhereaboutsApiClient()

  let visitSessionsService: VisitSessionsService

  const OrchestrationApiClientFactory = jest.fn()
  const WhereaboutsApiClientFactory = jest.fn()

  const prisonId = 'HEI'

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    WhereaboutsApiClientFactory.mockReturnValue(whereaboutsApiClient)

    visitSessionsService = new VisitSessionsService(
      OrchestrationApiClientFactory,
      WhereaboutsApiClientFactory,
      hmppsAuthClient,
    )
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
        username: 'user1',
      })

      expect(orchestrationApiClient.getSingleVisitSession).toHaveBeenCalledWith(
        'HEI',
        sessionDate,
        visitSession.sessionTemplateReference,
      )
      expect(results).toEqual(visitSession)
    })
  })

  describe('getVisitSessions', () => {
    it('Should return empty object if no visit sessions', async () => {
      orchestrationApiClient.getVisitSessions.mockResolvedValue([])
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
      expect(results).toEqual({ slotsList: {}, whereaboutsAvailable: true })
    })

    describe('single visit session should return correctly formatted data', () => {
      let sessions: VisitSession[]

      beforeEach(() => {
        sessions = [
          {
            sessionTemplateReference: 'v9d.7ed.7u',
            visitRoom: 'A1',
            visitType: 'SOCIAL',
            prisonId: 'HEI',
            openVisitCapacity: 15,
            openVisitBookedCount: 0,
            closedVisitCapacity: 10,
            closedVisitBookedCount: 0,
            startTimestamp: '2022-02-14T10:00:00',
            endTimestamp: '2022-02-14T11:00:00',
          },
        ]

        orchestrationApiClient.getVisitSessions.mockResolvedValue(sessions)
      })

      it('with a prisoner event', async () => {
        const events: ScheduledEvent[] = [
          {
            bookingId: 123,
            eventClass: 'eventClass',
            eventDate: '2022-02-14T',
            startTime: '2022-02-14T10:00:00',
            endTime: '2022-02-14T11:00:00',
            eventSource: 'eventSource',
            eventSourceDesc: 'eventSourceDesc',
            eventStatus: 'eventStatus',
            eventSubType: 'eventSubType',
            eventSubTypeDesc: 'eventSubTypeDesc',
            eventType: 'eventType',
            eventTypeDesc: 'eventTypeDesc',
          },
        ]
        whereaboutsApiClient.getEvents.mockResolvedValue(events)
        const results = await visitSessionsService.getVisitSessions({
          username: 'user',
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
          slotsList: {
            'February 2022': [
              {
                date: 'Monday 14 February',
                prisonerEvents: {
                  morning: [
                    {
                      description: 'Activity - eventSourceDesc',
                      endTimestamp: '2022-02-14T11:00:00',
                      startTimestamp: '2022-02-14T10:00:00',
                    },
                  ],
                  afternoon: [],
                },
                slots: {
                  morning: [
                    {
                      id: '1',
                      sessionTemplateReference: 'v9d.7ed.7u',
                      prisonId,
                      startTimestamp: '2022-02-14T10:00:00',
                      endTimestamp: '2022-02-14T11:00:00',
                      availableTables: 15,
                      capacity: 15,
                      visitRoom: 'A1',
                      visitRestriction: 'OPEN',
                    },
                  ],
                  afternoon: [],
                },
              },
            ],
          },
          whereaboutsAvailable: true,
        })
      })

      it('with a non-relevant prisoner event', async () => {
        const events: ScheduledEvent[] = [
          {
            bookingId: 123,
            eventClass: 'eventClass',
            eventDate: '2022-03-14T',
            startTime: '2022-03-14T10:00:00',
            endTime: '2022-03-14T11:00:00',
            eventSource: 'eventSource',
            eventSourceDesc: 'eventSourceDesc',
            eventStatus: 'eventStatus',
            eventSubType: 'eventSubType',
            eventSubTypeDesc: 'eventSubTypeDesc',
            eventType: 'eventType',
            eventTypeDesc: 'eventTypeDesc',
          },
        ]
        whereaboutsApiClient.getEvents.mockResolvedValue(events)
        const results = await visitSessionsService.getVisitSessions({
          username: 'user',
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
          slotsList: {
            'February 2022': [
              {
                date: 'Monday 14 February',
                prisonerEvents: {
                  morning: [],
                  afternoon: [],
                },
                slots: {
                  morning: [
                    {
                      id: '1',
                      sessionTemplateReference: 'v9d.7ed.7u',
                      prisonId,
                      startTimestamp: '2022-02-14T10:00:00',
                      endTimestamp: '2022-02-14T11:00:00',
                      availableTables: 15,
                      capacity: 15,
                      visitRoom: 'A1',
                      visitRestriction: 'OPEN',
                    },
                  ],
                  afternoon: [],
                },
              },
            ],
          },
          whereaboutsAvailable: true,
        })
      })

      it('with no prisoner events', async () => {
        whereaboutsApiClient.getEvents.mockResolvedValue([])
        const results = await visitSessionsService.getVisitSessions({
          username: 'user',
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
          slotsList: {
            'February 2022': [
              {
                date: 'Monday 14 February',
                prisonerEvents: {
                  morning: [],
                  afternoon: [],
                },
                slots: {
                  morning: [
                    {
                      id: '1',
                      sessionTemplateReference: 'v9d.7ed.7u',
                      prisonId,
                      startTimestamp: '2022-02-14T10:00:00',
                      endTimestamp: '2022-02-14T11:00:00',
                      availableTables: 15,
                      capacity: 15,
                      visitRoom: 'A1',
                      visitRestriction: 'OPEN',
                    },
                  ],
                  afternoon: [],
                },
              },
            ],
          },
          whereaboutsAvailable: true,
        })
      })
    })

    it('Should handle closed visits', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateReference: 'v9d.7ed.7u',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 1,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 2,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
        },
      ]

      orchestrationApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
      expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
        slotsList: {
          'February 2022': [
            {
              date: 'Monday 14 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '1',
                    sessionTemplateReference: 'v9d.7ed.7u',
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 8,
                    capacity: 10,
                    visitRoom: 'A1',
                    visitRestriction: 'CLOSED',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        },
        whereaboutsAvailable: true,
      })
    })

    it('Should handle multiple visit sessions and return correctly formatted data', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateReference: 'v9d.7ed.7u1',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 0,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u2',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 5,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T11:59:00',
          endTimestamp: '2022-02-14T12:59:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u3',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 10,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T12:00:00',
          endTimestamp: '2022-02-14T13:05:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u4',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 3,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-15T16:00:00',
          endTimestamp: '2022-02-15T17:00:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u5',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 15,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-03-01T09:30:00',
          endTimestamp: '2022-03-01T10:30:00',
        },
      ]

      orchestrationApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
      expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
        slotsList: {
          'February 2022': [
            {
              date: 'Monday 14 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '1',
                    sessionTemplateReference: 'v9d.7ed.7u1',
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    capacity: 15,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                  {
                    id: '2',
                    sessionTemplateReference: 'v9d.7ed.7u2',
                    prisonId,
                    startTimestamp: '2022-02-14T11:59:00',
                    endTimestamp: '2022-02-14T12:59:00',
                    availableTables: 10,
                    capacity: 15,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [
                  {
                    id: '3',
                    sessionTemplateReference: 'v9d.7ed.7u3',
                    prisonId,
                    startTimestamp: '2022-02-14T12:00:00',
                    endTimestamp: '2022-02-14T13:05:00',
                    availableTables: 5,
                    capacity: 15,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
              },
            },
            {
              date: 'Tuesday 15 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [],
                afternoon: [
                  {
                    id: '4',
                    sessionTemplateReference: 'v9d.7ed.7u4',
                    prisonId,
                    startTimestamp: '2022-02-15T16:00:00',
                    endTimestamp: '2022-02-15T17:00:00',
                    availableTables: 12,
                    capacity: 15,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
              },
            },
          ],
          'March 2022': [
            {
              date: 'Tuesday 1 March',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '5',
                    sessionTemplateReference: 'v9d.7ed.7u5',
                    prisonId,
                    startTimestamp: '2022-03-01T09:30:00',
                    endTimestamp: '2022-03-01T10:30:00',
                    availableTables: 0,
                    capacity: 15,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        },
        whereaboutsAvailable: true,
      })
    })

    it('Should display single slot - ignoring slots with no capacity on current visit restriction (open)', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateReference: 'v9d.7ed.7u1',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 1,
          openVisitBookedCount: 0,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T09:00:00',
          endTimestamp: '2022-02-14T10:00:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u2',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 0,
          openVisitBookedCount: 0,
          closedVisitCapacity: 10,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T10:30:00',
          endTimestamp: '2022-02-14T11:30:00',
        },
      ]

      orchestrationApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
      expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
        slotsList: {
          'February 2022': [
            {
              date: 'Monday 14 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '1',
                    sessionTemplateReference: 'v9d.7ed.7u1',
                    prisonId,
                    startTimestamp: '2022-02-14T09:00:00',
                    endTimestamp: '2022-02-14T10:00:00',
                    availableTables: 1,
                    capacity: 1,
                    visitRoom: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        },
        whereaboutsAvailable: true,
      })
    })

    it('Should display single slot - ignoring slots with no capacity on current visit restriction (closed)', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateReference: 'v9d.7ed.7u1',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 15,
          openVisitBookedCount: 0,
          closedVisitCapacity: 1,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T09:00:00',
          endTimestamp: '2022-02-14T10:00:00',
        },
        {
          sessionTemplateReference: 'v9d.7ed.7u2',
          visitRoom: 'A1',
          visitType: 'SOCIAL',
          prisonId: 'HEI',
          openVisitCapacity: 10,
          openVisitBookedCount: 0,
          closedVisitCapacity: 0,
          closedVisitBookedCount: 0,
          startTimestamp: '2022-02-14T10:30:00',
          endTimestamp: '2022-02-14T11:30:00',
        },
      ]

      orchestrationApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user', 2)
      expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
        slotsList: {
          'February 2022': [
            {
              date: 'Monday 14 February',
              prisonerEvents: {
                morning: [],
                afternoon: [],
              },
              slots: {
                morning: [
                  {
                    id: '1',
                    sessionTemplateReference: 'v9d.7ed.7u1',
                    prisonId,
                    startTimestamp: '2022-02-14T09:00:00',
                    endTimestamp: '2022-02-14T10:00:00',
                    availableTables: 1,
                    capacity: 1,
                    visitRoom: 'A1',
                    visitRestriction: 'CLOSED',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        },
        whereaboutsAvailable: true,
      })
    })
  })

  describe('getSessionSchedule', () => {
    it('should return an array of scheduled sessions for the specified prison and date', async () => {
      const date = '2023-02-01'
      const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]

      orchestrationApiClient.getSessionSchedule.mockResolvedValue(sessionSchedule)

      const results = await visitSessionsService.getSessionSchedule({ username: 'user', prisonId, date })

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
        'user',
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
    it('should return CalendarMonth array from given SessionsAndScheduleDtos', async () => {
      const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
        sessionsAndSchedule: [
          TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),
          TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [TestData.visitSessionV2()] }),
          TestData.sessionsAndScheduleDto({
            date: '2025-09-01',
            visitSessions: [TestData.visitSessionV2(), TestData.visitSessionV2()],
          }),
          TestData.sessionsAndScheduleDto({
            date: '2025-09-02',
            visitSessions: [TestData.visitSessionV2(), TestData.visitSessionV2(), TestData.visitSessionV2()],
          }),
        ],
      })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const expectedCalendar: CalendarMonth[] = [
        {
          monthLabel: 'August',
          days: [
            { date: '2025-08-30', sessionCount: 0 },
            { date: '2025-08-31', sessionCount: 1, selected: true },
          ],
        },
        {
          monthLabel: 'September',
          days: [
            { date: '2025-09-01', sessionCount: 2 },
            { date: '2025-09-02', sessionCount: 3 },
          ],
        },
      ]

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username: 'user',
        prisonId,
        prisonerId: 'A1234BC',
        minNumberOfDays: 2,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
      })

      expect(result.calendar).toStrictEqual(expectedCalendar)
    })

    describe('Selected calendar grid day', () => {
      it('should default to selecting the first day with a visit session if selectedVisitSession not set', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),
            TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [TestData.visitSessionV2()] }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const expectedCalendar: CalendarMonth[] = [
          {
            monthLabel: 'August',
            days: [
              { date: '2025-08-30', sessionCount: 0 },
              { date: '2025-08-31', sessionCount: 1, selected: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username: 'user',
          prisonId,
          prisonerId: 'A1234BC',
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should select day matching selectedVisitSession', async () => {
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

        const expectedCalendar: CalendarMonth[] = [
          {
            monthLabel: 'August',
            days: [
              { date: '2025-08-30', sessionCount: 1 },
              { date: '2025-08-31', sessionCount: 1, selected: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username: 'user',
          prisonId,
          prisonerId: 'A1234BC',
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: { date: '2025-08-31', sessionTemplateReference: 'b' },
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should default to selecting the first day with a visit session if selectedVisitSession not found', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),
            TestData.sessionsAndScheduleDto({ date: '2025-08-31', visitSessions: [TestData.visitSessionV2()] }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const expectedCalendar: CalendarMonth[] = [
          {
            monthLabel: 'August',
            days: [
              { date: '2025-08-30', sessionCount: 0 },
              { date: '2025-08-31', sessionCount: 1, selected: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username: 'user',
          prisonId,
          prisonerId: 'A1234BC',
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: { date: '0000-00-00', sessionTemplateReference: 'not found' },
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })
    })

    it('should return visit sessions and events, split into morning / afternoon', async () => {
      const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
        sessionsAndSchedule: [
          // no sessions; should be ignored
          TestData.sessionsAndScheduleDto({ date: '2025-08-30', visitSessions: [] }),

          // morning visit slots only
          TestData.sessionsAndScheduleDto({
            date: '2025-08-31',
            visitSessions: [
              TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00', sessionTemplateReference: 'a' }),
              TestData.visitSessionV2({ startTime: '11:30', endTime: '12:30', sessionTemplateReference: 'b' }),
            ],
            scheduledEvents: [
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education' }),
              // ignored (after cut-off and no afternoon visit sessions)
              TestData.prisonerScheduledEvent({ startTime: '12:00', endTime: '13:00' }),
            ],
          }),

          // afternoon visit slots only
          TestData.sessionsAndScheduleDto({
            date: '2025-09-01',
            visitSessions: [
              TestData.visitSessionV2({ startTime: '13:00', endTime: '14:30', sessionTemplateReference: 'c' }),
            ],
            scheduledEvents: [
              // ignored (before cut-off and no morning visit sessions)
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education' }),
              TestData.prisonerScheduledEvent({ startTime: '14:30', endTime: '16:00', eventSourceDesc: 'Education' }),
            ],
          }),

          // morning and afternoon visit slots
          TestData.sessionsAndScheduleDto({
            date: '2025-09-02',
            visitSessions: [
              TestData.visitSessionV2({ startTime: '10:00', endTime: '11:00', sessionTemplateReference: 'd' }),
              TestData.visitSessionV2({ startTime: '13:00', endTime: '14:30', sessionTemplateReference: 'e' }),
            ],
            scheduledEvents: [
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education' }),
              TestData.prisonerScheduledEvent({ startTime: '14:30', endTime: '16:00', eventSourceDesc: 'Education' }),
            ],
          }),
        ],
      })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const expectedCalendarFullDays: CalendarFullDay[] = [
        {
          date: '2025-08-31',
          daySection: [
            {
              label: 'morning',
              visitSessions: [
                {
                  sessionTemplateReference: 'a',
                  time: '10am to 11am',
                  visitRoom: TestData.visitSessionV2().visitRoom,
                  availableTables: 18,
                },
                {
                  sessionTemplateReference: 'b',
                  time: '11:30am to 12:30pm',
                  visitRoom: TestData.visitSessionV2().visitRoom,
                  availableTables: 18,
                },
              ],
              scheduledEvents: [{ time: '9am to 11am', description: 'Activity - Education' }],
            },
          ],
        },
        {
          date: '2025-09-01',
          daySection: [
            {
              label: 'afternoon',
              visitSessions: [
                {
                  sessionTemplateReference: 'c',
                  time: '1pm to 2:30pm',
                  visitRoom: TestData.visitSessionV2().visitRoom,
                  availableTables: 18,
                },
              ],
              scheduledEvents: [{ time: '2:30pm to 4pm', description: 'Activity - Education' }],
            },
          ],
        },
        {
          date: '2025-09-02',
          daySection: [
            {
              label: 'morning',
              visitSessions: [
                {
                  sessionTemplateReference: 'd',
                  time: '10am to 11am',
                  visitRoom: TestData.visitSessionV2().visitRoom,
                  availableTables: 18,
                },
              ],
              scheduledEvents: [{ time: '9am to 11am', description: 'Activity - Education' }],
            },
            {
              label: 'afternoon',
              visitSessions: [
                {
                  sessionTemplateReference: 'e',
                  time: '1pm to 2:30pm',
                  visitRoom: TestData.visitSessionV2().visitRoom,
                  availableTables: 18,
                },
              ],
              scheduledEvents: [{ time: '2:30pm to 4pm', description: 'Activity - Education' }],
            },
          ],
        },
      ]

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username: 'user',
        prisonId,
        prisonerId: 'A1234BC',
        minNumberOfDays: 2,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
      })

      expect(result.calendarFullDays).toStrictEqual(expectedCalendarFullDays)
    })

    // TODO calendar test - colour
    // TODO calendar test - selected
    // TODO calendar test - outline

    // TODO open / closed counts

    // TODO disabled visit session

    // TODO GOVUK tags
  })
})
