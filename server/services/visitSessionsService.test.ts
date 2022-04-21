import VisitSessionsService from './visitSessionsService'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import { VisitSession, Visit, SupportType } from '../data/visitSchedulerApiTypes'
import { VisitSlotList, VisitSessionData, VisitInformation } from '../@types/bapv'

jest.mock('../data/visitSchedulerApiClient')
jest.mock('../data/whereaboutsApiClient')

const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>
const whereaboutsApiClient = new WhereaboutsApiClient(null) as jest.Mocked<WhereaboutsApiClient>

describe('Visit sessions service', () => {
  let visitSchedulerApiClientBuilder
  let whereaboutsApiClientBuilder
  let visitSessionsService: VisitSessionsService
  let systemToken

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
    whereaboutsApiClientBuilder = jest.fn().mockReturnValue(whereaboutsApiClient)
    visitSessionsService = new VisitSessionsService(
      visitSchedulerApiClientBuilder,
      whereaboutsApiClientBuilder,
      systemToken
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdditionalSupportOptions', () => {
    it('should return an array of available support options', async () => {
      const availableSupportTypes: SupportType[] = [
        {
          type: 'WHEELCHAIR',
          description: 'Wheelchair ramp',
        },
        {
          type: 'OTHER',
          description: 'Other',
        },
      ]

      visitSchedulerApiClient.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)

      const results = await visitSessionsService.getAvailableSupportOptions('user')

      expect(visitSchedulerApiClient.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(availableSupportTypes)
    })
  })

  describe('getVisitSessions', () => {
    it('Should return empty object if no visit sessions', async () => {
      visitSchedulerApiClient.getVisitSessions.mockResolvedValue([])
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({ username: 'user', offenderNo: 'A1234BC' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual({})
    })

    describe('single visit session should return correctly formatted data', () => {
      let sessions: VisitSession[]

      beforeEach(() => {
        sessions = [
          {
            sessionTemplateId: 100,
            visitRoomName: 'A1',
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

        visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      })

      it('with a prisoner event', async () => {
        const events = [
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
        const results = await visitSessionsService.getVisitSessions({ username: 'user', offenderNo: 'A1234BC' })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<VisitSlotList>{
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
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    visitRoomName: 'A1',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        })
      })

      it('with a non-relevant prisoner event', async () => {
        const events = [
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
        const results = await visitSessionsService.getVisitSessions({ username: 'user', offenderNo: 'A1234BC' })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<VisitSlotList>{
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
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    visitRoomName: 'A1',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        })
      })

      it('with no prisoner events', async () => {
        whereaboutsApiClient.getEvents.mockResolvedValue([])
        const results = await visitSessionsService.getVisitSessions({ username: 'user', offenderNo: 'A1234BC' })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(whereaboutsApiClient.getEvents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(<VisitSlotList>{
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
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    visitRoomName: 'A1',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        })
      })
    })

    it('Should handle multiple visit sessions and return correctly formatted data', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 10,
          visitRoomName: 'A1',
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
          sessionTemplateId: 11,
          visitRoomName: 'A1',
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
          sessionTemplateId: 12,
          visitRoomName: 'A1',
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
          sessionTemplateId: 13,
          visitRoomName: 'A1',
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
          sessionTemplateId: 14,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({ username: 'user', offenderNo: 'A1234BC' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
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
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  visitRoomName: 'A1',
                },
                {
                  id: '2',
                  startTimestamp: '2022-02-14T11:59:00',
                  endTimestamp: '2022-02-14T12:59:00',
                  availableTables: 10,
                  visitRoomName: 'A1',
                },
              ],
              afternoon: [
                {
                  id: '3',
                  startTimestamp: '2022-02-14T12:00:00',
                  endTimestamp: '2022-02-14T13:05:00',
                  availableTables: 5,
                  visitRoomName: 'A1',
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
                  startTimestamp: '2022-02-15T16:00:00',
                  endTimestamp: '2022-02-15T17:00:00',
                  availableTables: 12,
                  visitRoomName: 'A1',
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
                  startTimestamp: '2022-03-01T09:30:00',
                  endTimestamp: '2022-03-01T10:30:00',
                  availableTables: 0,
                  visitRoomName: 'A1',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })

    it('Should return a single result when filtering by time of day when single slot matches filter', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 100,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        timeOfDay: 'morning',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
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
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  visitRoomName: 'A1',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })

    it("Should return no results when filtering by time of day when single slot doesn't match filter", async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 100,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        timeOfDay: 'afternoon',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
            prisonerEvents: {
              morning: [],
              afternoon: [],
            },
            slots: {
              morning: [],
              afternoon: [],
            },
          },
        ],
      })
    })

    it('Should return a single result when filtering by day of the week when single slot matches filter', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 100,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        dayOfTheWeek: '1',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
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
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  visitRoomName: 'A1',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })

    it("Should return a no results when filtering by day of the week when single slot doesn't match filter", async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 100,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        dayOfTheWeek: '2',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{})
    })
  })

  describe('createVisit', () => {
    it('should create a new visit and return the visit data', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: 'A1234BC',
          name: 'pri name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visit: {
          id: 'visitId',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          visitRoomName: 'visit room',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'rel desc',
            restrictions: [
              {
                restrictionType: 'TEST',
                restrictionTypeDescription: 'test type',
                startDate: '10 May 2020',
                expiryDate: '10 May 2022',
                globalRestriction: false,
                comment: 'comments',
              },
            ],
            banned: false,
          },
        ],
      }
      const visit: Visit = {
        reference: 'v9-d7-ed-7u',
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visit.visitRoomName,
        visitType: 'SOCIAL',
        visitStatus: 'RESERVED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
      }

      visitSchedulerApiClient.createVisit.mockResolvedValue(visit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const result = await visitSessionsService.createVisit({ username: 'user', visitData: visitSessionData })

      expect(visitSchedulerApiClient.createVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual('v9-d7-ed-7u')
    })
  })

  describe('updateVisit', () => {
    it('should update an existing visit and return the visit data', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: 'A1234BC',
          name: 'pri name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visit: {
          id: 'visitId',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          visitRoomName: 'visit room',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'rel desc',
            restrictions: [
              {
                restrictionType: 'TEST',
                restrictionTypeDescription: 'test type',
                startDate: '10 May 2020',
                expiryDate: '10 May 2022',
                globalRestriction: false,
                comment: 'comments',
              },
            ],
            banned: false,
          },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER' }],
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
        },
        visitReference: 'v9-d7-ed-7u',
      }
      const visit: Visit = {
        reference: 'v9-d7-ed-7u',
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visit.visitRoomName,
        visitType: 'SOCIAL',
        visitStatus: 'RESERVED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
      }

      visitSchedulerApiClient.updateVisit.mockResolvedValue(visit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const result = await visitSessionsService.updateVisit({ username: 'user', visitData: visitSessionData })

      expect(visitSchedulerApiClient.updateVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(<Visit>{
        reference: 'v9-d7-ed-7u',
        prisonerId: 'A1234BC',
        prisonId: 'HEI',
        visitRoom: 'visit room',
        visitType: 'SOCIAL',
        visitStatus: 'RESERVED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitContact: { name: 'John Smith', telephone: '01234 567890' },
        visitors: [{ nomisPersonId: 1234 }],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
      })
    })
  })

  describe('getVisit', () => {
    it('should return VisitInformation given a visit reference', async () => {
      const visit: Visit = {
        reference: 'v9-d7-ed-7u',
        prisonerId: 'A1234BC',
        prisonId: 'HEI',
        visitRoom: 'visit room',
        visitType: 'SOCIAL',
        visitStatus: 'BOOKED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:15:00',
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
      }

      visitSchedulerApiClient.getVisit.mockResolvedValue(visit)
      const result = await visitSessionsService.getVisit({ username: 'user', reference: 'v9-d7-ed-7u' })

      expect(visitSchedulerApiClient.getVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(<VisitInformation>{
        reference: 'v9-d7-ed-7u',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'John Smith',
        visitDate: '14 February 2022',
        visitTime: '10am to 11:15am',
      })
    })
  })

  describe('getUpcomingVisits', () => {
    it('should return an array of upcoming VisitInformation for an offender', async () => {
      const visits: Visit[] = [
        {
          reference: 'v9-d7-ed-7u',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitRoom: 'visit room',
          visitType: 'SOCIAL',
          visitStatus: 'BOOKED',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:15:00',
          visitContact: {
            name: 'John Smith',
            telephone: '01234 567890',
          },
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [],
        },
      ]

      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue(visits)
      const result = await visitSessionsService.getUpcomingVisits({ username: 'user', offenderNo: 'A1234BC' })

      expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledWith('A1234BC')
      expect(result).toEqual(<VisitInformation[]>[
        {
          reference: 'v9-d7-ed-7u',
          prisonNumber: 'A1234BC',
          prisonerName: '',
          mainContact: 'John Smith',
          visitDate: '14 February 2022',
          visitTime: '10am to 11:15am',
        },
      ])
    })

    it('should return an empty array for an offender with no upcoming visits', async () => {
      const visits: Visit[] = []

      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue(visits)
      const result = await visitSessionsService.getUpcomingVisits({ username: 'user', offenderNo: 'A1234BC' })

      expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledWith('A1234BC')
      expect(result).toEqual([])
    })
  })
})
