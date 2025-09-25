import { GOVUKTag, VisitSlotList } from '../@types/bapv'
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
const username = 'user1'

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

  describe('getVisitSessions', () => {
    it('Should return empty object if no visit sessions', async () => {
      orchestrationApiClient.getVisitSessions.mockResolvedValue([])
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username,
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
          username,
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
          username,
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
          username,
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
          minNumberOfDays: 2,
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
        username,
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
        username,
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
        username,
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
        username,
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
        minNumberOfDays: 2,
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, 'user1', 2)
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
            { date: '2025-08-30', sessionCount: 0, selected: false, outline: false },
            { date: '2025-08-31', sessionCount: 1, selected: true, outline: false },
          ],
        },
        {
          monthLabel: 'September',
          days: [
            { date: '2025-09-01', sessionCount: 2, selected: false, outline: false },
            { date: '2025-09-02', sessionCount: 3, selected: false, outline: false },
          ],
        },
      ]

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username,
        prisonId,
        prisonerId,
        minNumberOfDays: 2,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
        originalVisitSession: undefined,
      })

      expect(result.calendar).toStrictEqual(expectedCalendar)
      expect(orchestrationApiClient.getVisitSessionsAndSchedule).toHaveBeenCalledWith({
        prisonId,
        prisonerId,
        minNumberOfDays,
        username,
      })
    })

    it('should return visit sessions and events with day section (morning / afternoon) added', async () => {
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
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education 1' }),
            ],
          }),

          // afternoon visit slots only
          TestData.sessionsAndScheduleDto({
            date: '2025-09-01',
            visitSessions: [
              TestData.visitSessionV2({ startTime: '13:00', endTime: '14:30', sessionTemplateReference: 'c' }),
            ],
            scheduledEvents: [
              TestData.prisonerScheduledEvent({ startTime: '14:30', endTime: '16:00', eventSourceDesc: 'Education 2' }),
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
              TestData.prisonerScheduledEvent({ startTime: '09:00', endTime: '11:00', eventSourceDesc: 'Education 3' }),
              TestData.prisonerScheduledEvent({ startTime: '14:30', endTime: '16:00', eventSourceDesc: 'Education 4' }),
            ],
          }),
        ],
      })
      orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

      const expectedCalendarFullDays: CalendarFullDay[] = [
        {
          date: '2025-08-31',
          visitSessions: [
            {
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              disabled: false,
            },
            {
              date: '2025-08-31',
              sessionTemplateReference: 'b',
              daySection: 'morning',
              startTime: '11:30',
              endTime: '12:30',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              disabled: false,
            },
          ],
          scheduledEvents: [
            { daySection: 'morning', startTime: '09:00', endTime: '11:00', description: 'Activity - Education 1' },
          ],
        },
        {
          date: '2025-09-01',
          visitSessions: [
            {
              date: '2025-09-01',
              sessionTemplateReference: 'c',
              daySection: 'afternoon',
              startTime: '13:00',
              endTime: '14:30',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              disabled: false,
            },
          ],
          scheduledEvents: [
            { daySection: 'afternoon', startTime: '14:30', endTime: '16:00', description: 'Activity - Education 2' },
          ],
        },
        {
          date: '2025-09-02',
          visitSessions: [
            {
              date: '2025-09-02',
              sessionTemplateReference: 'd',
              daySection: 'morning',
              startTime: '10:00',
              endTime: '11:00',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              disabled: false,
            },
            {
              date: '2025-09-02',
              sessionTemplateReference: 'e',
              daySection: 'afternoon',
              startTime: '13:00',
              endTime: '14:30',
              visitRoom: TestData.visitSessionV2().visitRoom,
              availableTables: 18,
              capacity: 20,
              disabled: false,
            },
          ],
          scheduledEvents: [
            { daySection: 'morning', startTime: '09:00', endTime: '11:00', description: 'Activity - Education 3' },
            { daySection: 'afternoon', startTime: '14:30', endTime: '16:00', description: 'Activity - Education 4' },
          ],
        },
      ]

      const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
        username,
        prisonId,
        prisonerId,
        minNumberOfDays: 2,
        visitRestriction: 'OPEN',
        selectedVisitSession: undefined,
        originalVisitSession: undefined,
      })

      expect(result.calendarFullDays).toStrictEqual(expectedCalendarFullDays)
    })

    describe('Selected calendar grid day', () => {
      it('should select and outline day matching selectedVisitSession', async () => {
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
              { date: '2025-08-30', sessionCount: 1, selected: false, outline: false },
              { date: '2025-08-31', sessionCount: 1, selected: true, outline: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
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

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should default to selecting the first day with a visit session and outlining selectedVisitSession date if selectedVisitSession not found', async () => {
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
              { date: '2025-08-30', sessionCount: 0, selected: false, outline: true },
              { date: '2025-08-31', sessionCount: 1, selected: true, outline: false },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
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

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should default to selecting but NOT outlining the first day with a visit session if selectedVisitSession not set', async () => {
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
              { date: '2025-08-30', sessionCount: 0, selected: false, outline: false },
              { date: '2025-08-31', sessionCount: 1, selected: true, outline: false },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })
    })

    describe('Original booking (update journey)', () => {
      it('should select and outline day matching originalVisitSession if that visit session is present', async () => {
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
              { date: '2025-08-30', sessionCount: 1, selected: false, outline: false },
              { date: '2025-08-31', sessionCount: 1, selected: true, outline: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: { date: '2025-08-31', sessionTemplateReference: 'b' },
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
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

        const expectedCalendar: CalendarMonth[] = [
          {
            monthLabel: 'August',
            days: [
              { date: '2025-08-30', sessionCount: 0, selected: false, outline: true },
              { date: '2025-08-31', sessionCount: 1, selected: true, outline: false },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: { date: '2025-08-30', sessionTemplateReference: 'a' },
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should outline day matching originalVisitSession and outline and select selectedVisitSession', async () => {
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
              { date: '2025-08-30', sessionCount: 1, selected: true, outline: true },
              { date: '2025-08-31', sessionCount: 1, selected: false, outline: true },
            ],
          },
        ]

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: '2025-08-31',
            sessionTemplateReference: 'b',
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: { date: '2025-08-30', sessionTemplateReference: 'a' },
        })

        expect(result.calendar).toStrictEqual(expectedCalendar)
      })

      it('should tag the originally selected visit session', async () => {
        const originalVisitSession = TestData.visitSessionV2()

        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [TestData.sessionsAndScheduleDto({ visitSessions: [originalVisitSession] })],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: {
            date: visitSessionsAndSchedule.sessionsAndSchedule[0].date,
            sessionTemplateReference: originalVisitSession.sessionTemplateReference,
            startTime: '',
            endTime: '',
            availableTables: 1,
            capacity: 10,
          },
          originalVisitSession: {
            date: visitSessionsAndSchedule.sessionsAndSchedule[0].date,
            sessionTemplateReference: originalVisitSession.sessionTemplateReference,
          },
        })

        expect(result.calendarFullDays[0].visitSessions.length).toBe(1)
        expect(result.calendarFullDays[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Original booking',
          classes: 'govuk-tag--blue',
        })
      })
    })

    describe('Open / closed capacity', () => {
      it('should give availability based on open capacity for an OPEN visit restriction', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule() // closed count 20; booked 2
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendarFullDays[0].visitSessions[0].availableTables).toBe(18)
      })

      it('should give availability based on closed capacity for a CLOSED visit restriction', async () => {
        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule() // closed count 2; booked 1
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'CLOSED',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendarFullDays[0].visitSessions[0].availableTables).toBe(1)
      })
    })

    describe('Currently reserved visit session', () => {
      it('should tag the visit session matching the currently reserved visit session', async () => {
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
          minNumberOfDays: 2,
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

        expect(result.calendarFullDays[0].visitSessions.length).toBe(2)
        expect(result.calendarFullDays[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Reserved visit time',
          classes: 'govuk-tag--blue',
        })
        expect(result.calendarFullDays[0].visitSessions[1].tag).toBeUndefined()
      })
    })

    describe('Visit session when prisoner already has a visit', () => {
      it('should tag the visit session if prisoner already has a visit', async () => {
        const visitSessionWithExistingVisit = TestData.visitSessionV2({
          sessionTemplateReference: 'a',
          sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
        })
        const anotherVisitSession = TestData.visitSessionV2({ sessionTemplateReference: 'b' })

        const visitSessionsAndSchedule = TestData.visitSessionsAndSchedule({
          sessionsAndSchedule: [
            TestData.sessionsAndScheduleDto({
              visitSessions: [visitSessionWithExistingVisit, anotherVisitSession],
            }),
          ],
        })
        orchestrationApiClient.getVisitSessionsAndSchedule.mockResolvedValue(visitSessionsAndSchedule)

        const result = await visitSessionsService.getVisitSessionsAndScheduleCalendar({
          username,
          prisonId,
          prisonerId,
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendarFullDays[0].visitSessions.length).toBe(2)
        expect(result.calendarFullDays[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Prisoner has a visit',
          classes: 'govuk-tag--red',
        })
        expect(result.calendarFullDays[0].visitSessions[1].tag).toBeUndefined()
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
          minNumberOfDays: 2,
          visitRestriction: 'OPEN',
          selectedVisitSession: undefined,
          originalVisitSession: undefined,
        })

        expect(result.calendarFullDays[0].visitSessions.length).toBe(1)
        expect(result.calendarFullDays[0].visitSessions[0].tag).toStrictEqual<GOVUKTag>({
          text: 'Fully booked',
          classes: 'govuk-tag--red',
        })
      })
    })

    // TODO grid day colours (red / orange)
  })
})
