import VisitSessionsService from './visitSessionsService'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import { VisitSession, Visit } from '../data/visitSchedulerApiTypes'
import { VisitSlotList, VisitSessionData } from '../@types/bapv'

jest.mock('../data/visitSchedulerApiClient')

const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>

describe('Visit sessions service', () => {
  let visitSchedulerApiClientBuilder
  let visitSessionsService: VisitSessionsService
  let systemToken

  describe('getVisitSessions', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
      visitSessionsService = new VisitSessionsService(visitSchedulerApiClientBuilder, systemToken)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Should return empty object if no visit sessions', async () => {
      visitSchedulerApiClient.getVisitSessions.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({ username: 'user' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual({})
    })

    it('Should handle a single visit session and return correctly formatted data', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 100,
          visitRoomName: 'A1',
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
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

    it('Should handle multiple visit sessions and return correctly formatted data', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 10,
          visitRoomName: 'A1',
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user', timeOfDay: 'morning' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user', timeOfDay: 'afternoon' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user', dayOfTheWeek: '1' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{
        'February 2022': [
          {
            date: 'Monday 14 February',
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
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
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
      const results = await visitSessionsService.getVisitSessions({ username: 'user', dayOfTheWeek: '2' })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<VisitSlotList>{})
    })
  })

  describe('createVisit', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
      visitSessionsService = new VisitSessionsService(visitSchedulerApiClientBuilder, systemToken)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

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
        id: 'v9-d7-ed-7u',
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visit.visitRoomName,
        visitType: 'STANDARD_SOCIAL',
        visitTypeDescription: 'Standard Social',
        visitStatus: 'RESERVED',
        visitStatusDescription: 'Reserved',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        reasonableAdjustments: 'string',
        visitors: [
          {
            nomisPersonId: 1234,
            leadVisitor: true,
          },
        ],
        sessionId: 123,
      }

      visitSchedulerApiClient.createVisit.mockResolvedValue(visit)
      const result = await visitSessionsService.createVisit({ username: 'user', visitData: visitSessionData })

      expect(visitSchedulerApiClient.createVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual('v9-d7-ed-7u')
    })
  })

  describe('updateVisit', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
      visitSessionsService = new VisitSessionsService(visitSchedulerApiClientBuilder, systemToken)
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

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
        additionalSupport: {
          required: true,
          keys: ['wheelchair', 'maskExempt', 'other'],
          other: 'custom request',
        },
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
        },
        visitId: 'v9-d7-ed-7u',
      }
      const visit: Visit = {
        id: 'v9-d7-ed-7u',
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visit.visitRoomName,
        visitType: 'STANDARD_SOCIAL',
        visitTypeDescription: 'Standard Social',
        visitStatus: 'RESERVED',
        visitStatusDescription: 'Reserved',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        reasonableAdjustments: 'wheelchair,maskExempt,other,custom request',
        mainContact: {
          contactName: 'John Smith',
          contactPhone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
            leadVisitor: true,
          },
        ],
        sessionId: 123,
      }

      visitSchedulerApiClient.updateVisit.mockResolvedValue(visit)
      const result = await visitSessionsService.updateVisit({ username: 'user', visitData: visitSessionData })

      expect(visitSchedulerApiClient.updateVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        endTimestamp: '2022-02-14T11:00:00',
        id: 'v9-d7-ed-7u',
        mainContact: { contactName: 'John Smith', contactPhone: '01234 567890' },
        prisonId: 'HEI',
        prisonerId: 'A1234BC',
        reasonableAdjustments: 'wheelchair,maskExempt,other,custom request',
        sessionId: 123,
        startTimestamp: '2022-02-14T10:00:00',
        visitRoom: 'visit room',
        visitStatus: 'RESERVED',
        visitStatusDescription: 'Reserved',
        visitType: 'STANDARD_SOCIAL',
        visitTypeDescription: 'Standard Social',
        visitors: [{ leadVisitor: true, nomisPersonId: 1234 }],
      })
    })
  })
})
