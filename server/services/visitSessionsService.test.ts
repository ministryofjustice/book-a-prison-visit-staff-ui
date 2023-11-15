import { VisitSlotList } from '../@types/bapv'
import { VisitSession, SessionSchedule } from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import TestData from '../routes/testutils/testData'
import VisitSessionsService from './visitSessionsService'
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

  describe('getVisitSessions', () => {
    it('Should return empty object if no visit sessions', async () => {
      orchestrationApiClient.getVisitSessions.mockResolvedValue([])
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
        minNumberOfDays: '2',
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
          minNumberOfDays: '2',
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }>{
          slotsList: {
            'February 2022': [
              {
                date: 'Monday 14 February',
                prisonerEvents: {
                  morning: [
                    {
                      description: 'eventSourceDesc',
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
          minNumberOfDays: '2',
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
          minNumberOfDays: '2',
        })

        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
        minNumberOfDays: '2',
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
        minNumberOfDays: '2',
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
        minNumberOfDays: '2',
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
        minNumberOfDays: '2',
      })

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId, '2')
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
})
