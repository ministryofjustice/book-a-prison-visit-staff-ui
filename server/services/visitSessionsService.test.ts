import { NotFound } from 'http-errors'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import VisitSessionsService from './visitSessionsService'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import { VisitSession, Visit, OutcomeDto } from '../data/visitSchedulerApiTypes'
import { Address, Contact, AddressUsage, Restriction } from '../data/prisonerContactRegistryApiTypes'
import {
  VisitSlotList,
  VisitSessionData,
  VisitInformation,
  VisitorListItem,
  ExtendedVisitInformation,
  VisitsPageSlot,
} from '../@types/bapv'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import TestData from '../routes/testutils/testData'

jest.mock('../data/prisonerContactRegistryApiClient')
jest.mock('../data/visitSchedulerApiClient')
jest.mock('../data/whereaboutsApiClient')

const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(
  null,
) as jest.Mocked<PrisonerContactRegistryApiClient>
const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>
const whereaboutsApiClient = new WhereaboutsApiClient(null) as jest.Mocked<WhereaboutsApiClient>

describe('Visit sessions service', () => {
  let prisonerContactRegistryApiClientBuilder
  let visitSchedulerApiClientBuilder
  let whereaboutsApiClientBuilder
  let visitSessionsService: VisitSessionsService
  let systemToken

  const prisonId = 'HEI'
  const availableSupportTypes = TestData.supportTypes()

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    prisonerContactRegistryApiClientBuilder = jest.fn().mockReturnValue(prisonerContactRegistryApiClient)
    visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
    whereaboutsApiClientBuilder = jest.fn().mockReturnValue(whereaboutsApiClient)
    visitSessionsService = new VisitSessionsService(
      prisonerContactRegistryApiClientBuilder,
      visitSchedulerApiClientBuilder,
      whereaboutsApiClientBuilder,
      systemToken,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdditionalSupportOptions', () => {
    it('should return an array of available support options', async () => {
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
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
        })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    capacity: 15,
                    visitRoomName: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [],
              },
            },
          ],
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
        })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    capacity: 15,
                    visitRoomName: 'A1',
                    visitRestriction: 'OPEN',
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
        const results = await visitSessionsService.getVisitSessions({
          username: 'user',
          offenderNo: 'A1234BC',
          prisonId,
          visitRestriction: 'OPEN',
        })

        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                    prisonId,
                    startTimestamp: '2022-02-14T10:00:00',
                    endTimestamp: '2022-02-14T11:00:00',
                    availableTables: 15,
                    capacity: 15,
                    visitRoomName: 'A1',
                    visitRestriction: 'OPEN',
                  },
                ],
                afternoon: [],
              },
            },
          ],
        })
      })
    })

    it('Should handle closed visits', async () => {
      const sessions: VisitSession[] = [
        {
          sessionTemplateId: 10,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                  prisonId,
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 8,
                  capacity: 10,
                  visitRoomName: 'A1',
                  visitRestriction: 'CLOSED',
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
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                  prisonId,
                  startTimestamp: '2022-02-14T10:00:00',
                  endTimestamp: '2022-02-14T11:00:00',
                  availableTables: 15,
                  capacity: 15,
                  visitRoomName: 'A1',
                  visitRestriction: 'OPEN',
                },
                {
                  id: '2',
                  prisonId,
                  startTimestamp: '2022-02-14T11:59:00',
                  endTimestamp: '2022-02-14T12:59:00',
                  availableTables: 10,
                  capacity: 15,
                  visitRoomName: 'A1',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [
                {
                  id: '3',
                  prisonId,
                  startTimestamp: '2022-02-14T12:00:00',
                  endTimestamp: '2022-02-14T13:05:00',
                  availableTables: 5,
                  capacity: 15,
                  visitRoomName: 'A1',
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
                  prisonId,
                  startTimestamp: '2022-02-15T16:00:00',
                  endTimestamp: '2022-02-15T17:00:00',
                  availableTables: 12,
                  capacity: 15,
                  visitRoomName: 'A1',
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
                  prisonId,
                  startTimestamp: '2022-03-01T09:30:00',
                  endTimestamp: '2022-03-01T10:30:00',
                  availableTables: 0,
                  capacity: 15,
                  visitRoomName: 'A1',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })

    it('Should display single slot - ignoring slots with no capacity on current visit restriction (open)', async () => {
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
          startTimestamp: '2022-02-14T09:00:00',
          endTimestamp: '2022-02-14T10:00:00',
        },
        {
          sessionTemplateId: 11,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'OPEN',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                  prisonId,
                  startTimestamp: '2022-02-14T09:00:00',
                  endTimestamp: '2022-02-14T10:00:00',
                  availableTables: 15,
                  capacity: 15,
                  visitRoomName: 'A1',
                  visitRestriction: 'OPEN',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })

    it('Should display single slot - ignoring slots with no capacity on current visit restriction (closed)', async () => {
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
          startTimestamp: '2022-02-14T09:00:00',
          endTimestamp: '2022-02-14T10:00:00',
        },
        {
          sessionTemplateId: 11,
          visitRoomName: 'A1',
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

      visitSchedulerApiClient.getVisitSessions.mockResolvedValue(sessions)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const results = await visitSessionsService.getVisitSessions({
        username: 'user',
        offenderNo: 'A1234BC',
        prisonId,
        visitRestriction: 'CLOSED',
      })

      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.getVisitSessions).toHaveBeenCalledWith('A1234BC', prisonId)
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
                  prisonId,
                  startTimestamp: '2022-02-14T09:00:00',
                  endTimestamp: '2022-02-14T10:00:00',
                  availableTables: 10,
                  capacity: 10,
                  visitRoomName: 'A1',
                  visitRestriction: 'CLOSED',
                },
              ],
              afternoon: [],
            },
          },
        ],
      })
    })
  })

  describe('getVisitSessionCapacity', () => {
    it('should return the open and closed capacity for the specified visit session', async () => {
      const sessionCapacity = TestData.sessionCapacity()
      const sessionDate = '2023-01-31'
      const sessionStartTime = '10:00'
      const sessionEndTime = '11:00'

      visitSchedulerApiClient.getVisitSessionCapacity.mockResolvedValue(sessionCapacity)

      const results = await visitSessionsService.getVisitSessionCapacity(
        'user',
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(visitSchedulerApiClient.getVisitSessionCapacity).toHaveBeenCalledWith(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )
      expect(results).toEqual(sessionCapacity)
    })
  })

  describe('reserveVisitSlot', () => {
    it('should create a new RESERVED visit and return the visit data', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: 'A1234BC',
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: '1',
          prisonId,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          capacity: 15,
          visitRoomName: 'visit room',
          visitRestriction: 'OPEN',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'relationship desc',
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
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType: 'SOCIAL',
        visitStatus: 'RESERVED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      visitSchedulerApiClient.reserveVisit.mockResolvedValue(visit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const result = await visitSessionsService.reserveVisit({ username: 'user', visitSessionData })

      expect(visitSchedulerApiClient.reserveVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(visit)
    })
  })

  describe('changeReservedVisit', () => {
    it('should change an existing reserved visit and return the visit data', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: 'A1234BC',
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: 'visitId',
          prisonId,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          capacity: 15,
          visitRoomName: 'visit room',
          visitRestriction: 'OPEN',
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
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      }

      const visit: Visit = {
        applicationReference: visitSessionData.applicationReference,
        reference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType: 'SOCIAL',
        visitStatus: visitSessionData.visitStatus,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitNotes: [],
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
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      visitSchedulerApiClient.changeReservedVisit.mockResolvedValue(visit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])

      const result = await visitSessionsService.changeReservedVisit({
        username: 'user',
        visitSessionData,
      })

      expect(visitSchedulerApiClient.changeReservedVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(visit)
    })
  })

  describe('bookVisit', () => {
    it('should book a visit (change status from RESERVED to BOOKED)', async () => {
      const applicationReference = 'aaa-bbb-ccc'

      const visit: Partial<Visit> = {
        applicationReference,
        reference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      visitSchedulerApiClient.bookVisit.mockResolvedValue(visit as Visit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])
      const result = await visitSessionsService.bookVisit({ username: 'user', applicationReference })

      expect(visitSchedulerApiClient.bookVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(visit)
    })
  })

  describe('changeBookedVisit', () => {
    it('should change an existing booked visit and return the visit data with status RESERVED/CHANGING and new applicationReference', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: 'A1234BC',
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visitSlot: {
          id: 'visitId',
          prisonId,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          capacity: 15,
          visitRoomName: 'visit room',
          visitRestriction: 'OPEN',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'relationship desc',
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
        visitorSupport: [{ type: 'WHEELCHAIR' }],
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      const returnedVisit: Visit = {
        applicationReference: 'ddd-eee-fff',
        reference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: 'HEI',
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType: 'SOCIAL',
        visitStatus: 'CHANGING',
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitNotes: [],
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      visitSchedulerApiClient.changeBookedVisit.mockResolvedValue(returnedVisit)
      whereaboutsApiClient.getEvents.mockResolvedValue([])

      const result = await visitSessionsService.changeBookedVisit({
        username: 'user',
        visitSessionData,
      })

      expect(visitSchedulerApiClient.changeBookedVisit).toHaveBeenCalledTimes(1)
      expect(result).toEqual(returnedVisit)
    })
  })

  describe('cancelVisit', () => {
    it('should cancel a visit, giving the status code and reason', async () => {
      const expectedResult: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId: 'HEI',
        visitRoom: 'A1 L3',
        visitType: 'SOCIAL',
        visitStatus: 'CANCELLED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [
          {
            type: 'VISIT_OUTCOMES',
            text: 'VISITOR_CANCELLED',
          },
          {
            type: 'STATUS_CHANGED_REASON',
            text: 'cancellation reason',
          },
        ],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      const outcome: OutcomeDto = {
        outcomeStatus: 'VISITOR_CANCELLED',
        text: 'cancellation reason',
      }

      visitSchedulerApiClient.cancelVisit.mockResolvedValue(expectedResult)
      const result = await visitSessionsService.cancelVisit({
        username: 'user',
        reference: expectedResult.reference,
        outcome,
      })

      expect(visitSchedulerApiClient.cancelVisit).toHaveBeenCalledTimes(1)
      expect(visitSchedulerApiClient.cancelVisit).toHaveBeenCalledWith(expectedResult.reference, outcome)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getVisit', () => {
    const visit: Visit = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'visit room',
      visitType: 'SOCIAL',
      visitStatus: 'BOOKED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-14T10:00:00',
      endTimestamp: '2022-02-14T11:15:00',
      visitNotes: [],
      visitContact: {
        name: 'John Smith',
        telephone: '01234 567890',
      },
      visitors: [
        {
          nomisPersonId: 4321,
        },
        {
          nomisPersonId: 4324,
        },
      ],
      visitorSupport: [
        {
          type: 'WHEELCHAIR',
        },
        {
          type: 'OTHER',
          text: 'custom request',
        },
      ],
      createdTimestamp: '2022-02-14T10:00:00',
      modifiedTimestamp: '2022-02-14T10:05:00',
    }

    describe('getVisit', () => {
      it('should return VisitInformation given a visit reference and matching prisonId', async () => {
        visitSchedulerApiClient.getVisit.mockResolvedValue(visit)
        const result = await visitSessionsService.getVisit({ username: 'user', reference: 'ab-cd-ef-gh', prisonId })

        expect(visitSchedulerApiClient.getVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(<VisitInformation>{
          reference: 'ab-cd-ef-gh',
          prisonNumber: 'A1234BC',
          prisonerName: '',
          mainContact: 'John Smith',
          visitDate: '14 February 2022',
          visitTime: '10am to 11:15am',
          visitStatus: 'BOOKED',
        })
      })

      it('should throw a 404 if the visit is not at the given prisonId', async () => {
        visitSchedulerApiClient.getVisit.mockResolvedValue(visit)

        await expect(async () => {
          await visitSessionsService.getVisit({
            username: 'user',
            reference: 'ab-cd-ef-gh',
            prisonId: 'BLI',
          })

          expect(visitSchedulerApiClient.getVisit).toHaveBeenCalledTimes(1)
        }).rejects.toBeInstanceOf(NotFound)
      })
    })

    describe('getUpcomingVisits', () => {
      it('should return an array of upcoming VisitInformation for an offender', async () => {
        const visits: Visit[] = [visit]

        visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue({ content: visits })
        const result = await visitSessionsService.getUpcomingVisits({
          username: 'user',
          offenderNo: 'A1234BC',
          visitStatus: ['BOOKED'],
        })

        expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledWith('A1234BC', ['BOOKED'])
        expect(result).toEqual(<VisitInformation[]>[
          {
            reference: 'ab-cd-ef-gh',
            prisonNumber: 'A1234BC',
            prisonerName: '',
            mainContact: 'John Smith',
            visitDate: '14 February 2022',
            visitTime: '10am to 11:15am',
            visitStatus: 'BOOKED',
          },
        ])
      })

      it('should return an empty array for an offender with no upcoming visits', async () => {
        const visits: Visit[] = []

        visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue({ content: visits })
        const result = await visitSessionsService.getUpcomingVisits({
          username: 'user',
          offenderNo: 'A1234BC',
          visitStatus: ['BOOKED'],
        })

        expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getUpcomingVisits).toHaveBeenCalledWith('A1234BC', ['BOOKED'])
        expect(result).toEqual([])
      })
    })

    describe('getFullVisitDetails', () => {
      it('should return full details of visit, visitors and additional support options', async () => {
        const childDateOfBirth = `${new Date().getFullYear() - 4}-03-02`
        const contacts: Contact[] = [
          {
            personId: 4321,
            firstName: 'Jeanette',
            lastName: 'Smith',
            dateOfBirth: '1986-07-28',
            relationshipCode: 'SIS',
            relationshipDescription: 'Sister',
            contactType: 'S',
            approvedVisitor: true,
            emergencyContact: false,
            nextOfKin: false,
            restrictions: [
              {
                restrictionType: 'CLOSED',
                restrictionTypeDescription: 'Closed',
                startDate: '2022-01-03',
                globalRestriction: false,
              },
            ],
            addresses: [
              {
                street: '123 The Street',
                town: 'Coventry',
                primary: true,
                noFixedAddress: false,
                phones: [],
                addressUsages: [],
              },
            ],
          },
          {
            personId: 4322,
            firstName: 'Bob',
            lastName: 'Smith',
            relationshipCode: 'BRO',
            relationshipDescription: 'Brother',
            contactType: 'S',
            approvedVisitor: true,
            emergencyContact: false,
            nextOfKin: false,
            restrictions: [],
            addresses: [],
          },
          {
            personId: 4324,
            firstName: 'Anne',
            lastName: 'Smith',
            relationshipCode: 'NIE',
            dateOfBirth: childDateOfBirth,
            relationshipDescription: 'Niece',
            contactType: 'S',
            approvedVisitor: true,
            emergencyContact: false,
            nextOfKin: false,
            restrictions: [],
            addresses: [],
          },
        ]

        const expectedResult: { visit: Visit; visitors: VisitorListItem[]; additionalSupport: string[] } = {
          visit,
          visitors: [
            {
              personId: 4321,
              name: 'Jeanette Smith',
              dateOfBirth: '1986-07-28',
              adult: true,
              relationshipDescription: 'Sister',
              address: '123 The Street,<br>Coventry',
              restrictions: contacts[0].restrictions,
              banned: false,
            },
            {
              personId: 4324,
              name: 'Anne Smith',
              dateOfBirth: childDateOfBirth,
              adult: false,
              relationshipDescription: 'Niece',
              address: 'Not entered',
              restrictions: [],
              banned: false,
            },
          ],
          additionalSupport: ['Wheelchair ramp', 'custom request'],
        }

        prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)
        visitSchedulerApiClient.getAvailableSupportOptions.mockResolvedValue(availableSupportTypes)
        visitSchedulerApiClient.getVisit.mockResolvedValue(visit)

        const result = await visitSessionsService.getFullVisitDetails({ username: 'user', reference: 'ab-cd-ef-gh' })

        expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getAvailableSupportOptions).toHaveBeenCalledTimes(1)
        expect(visitSchedulerApiClient.getVisit).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
      })
    })
  })

  describe('getVisitsByDate', () => {
    it('should return empty data if no visit sessions on chosen date', async () => {
      visitSchedulerApiClient.getVisitsByDate.mockResolvedValue([])
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue([])
      const results = await visitSessionsService.getVisitsByDate({
        username: 'user',
        dateString: '2022-01-01',
        prisonId,
      })

      expect(visitSchedulerApiClient.getVisitsByDate).toHaveBeenCalledTimes(1)
      expect(results).toEqual({
        extendedVisitsInfo: [],
        slots: {
          closedSlots: [],
          firstSlotTime: undefined,
          openSlots: [],
          unknownSlots: [],
        },
      })
    })

    it('should return visit and prisoner data when session exists', async () => {
      const emptyAddresses: Address[] = []
      const emptyUsages: AddressUsage[] = []
      const emptyRestrictions: Restriction[] = []

      const visits: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ob-cw-lx-na',
          prisonerId: 'A8709DY',
          prisonId: 'HEI',
          visitRoom: 'VISITS-VISITS-H1_6LV',
          visitType: 'SOCIAL',
          visitStatus: 'BOOKED',
          outcomeStatus: 'NOT_RECORDED',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-05-23T09:00:00',
          endTimestamp: '2022-05-23T09:29:00',
          visitNotes: [],
          visitContact: {
            name: 'UNKNOWN',
            telephone: 'UNKNOWN',
          },
          visitors: [
            {
              nomisPersonId: 4729510,
            },
          ],
          visitorSupport: [],
          createdTimestamp: '2022-05-23T10:09:56.636334',
          modifiedTimestamp: '2022-05-23T10:09:56.64691',
        },
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'lb-co-bn-oe',
          prisonerId: 'A8709DY',
          prisonId: 'HEI',
          visitRoom: 'daily test room',
          visitType: 'SOCIAL',
          visitStatus: 'BOOKED',
          outcomeStatus: 'ADMINISTRATIVE_ERROR',
          visitRestriction: 'OPEN',
          startTimestamp: '2022-05-23T10:00:00',
          endTimestamp: '2022-05-23T11:00:00',
          visitNotes: [
            {
              type: 'VISIT_OUTCOMES',
              text: 'na',
            },
          ],
          visitContact: {
            name: 'Tess Bennett',
            telephone: '0114 5555555',
          },
          visitors: [
            {
              nomisPersonId: 4729570,
            },
            {
              nomisPersonId: 4729510,
            },
          ],
          visitorSupport: [],
          createdTimestamp: '2022-05-20T15:29:04.997067',
          modifiedTimestamp: '2022-05-20T15:51:49.983108',
        },
      ]
      const social: Contact[] = [
        {
          personId: 4729510,
          firstName: 'James',
          lastName: 'Smith',
          dateOfBirth: '1983-06-17',
          relationshipCode: 'BRO',
          relationshipDescription: 'Brother',
          contactType: 'S',
          contactTypeDescription: 'Social/ Family',
          approvedVisitor: true,
          emergencyContact: false,
          nextOfKin: false,
          addresses: [
            {
              addressType: 'Home Address',
              street: 'Warren way',
              town: 'Bootle',
              postalCode: 'DN5 9SD',
              country: 'England',
              primary: true,
              noFixedAddress: false,
              startDate: '2021-03-01',
              phones: [
                {
                  number: '0113222333',
                  type: 'BUS',
                },
                {
                  number: '222333',
                  type: 'HOME',
                },
              ],
              addressUsages: emptyUsages,
            },
          ],
          restrictions: emptyRestrictions,
        },
        {
          personId: 4729570,
          firstName: 'Tess',
          lastName: 'Bennett',
          relationshipCode: 'AUNT',
          relationshipDescription: 'Aunt',
          contactType: 'S',
          contactTypeDescription: 'Social/ Family',
          approvedVisitor: true,
          emergencyContact: false,
          nextOfKin: false,
          addresses: emptyAddresses,
          restrictions: emptyRestrictions,
        },
      ]

      visitSchedulerApiClient.getVisitsByDate.mockResolvedValue(visits)
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(social)
      const results = await visitSessionsService.getVisitsByDate({
        username: 'user',
        dateString: '2022-05-23',
        prisonId,
      })
      const resultsCheck: {
        extendedVisitsInfo: ExtendedVisitInformation[]
        slots: {
          openSlots: VisitsPageSlot[]
          closedSlots: VisitsPageSlot[]
          unknownSlots: VisitsPageSlot[]
          firstSlotTime: string
        }
      } = {
        extendedVisitsInfo: [
          {
            reference: 'ob-cw-lx-na',
            prisonNumber: 'A8709DY',
            prisonerName: '',
            mainContact: 'UNKNOWN',
            startTimestamp: '2022-05-23T09:00:00',
            endTimestamp: '2022-05-23T09:29:00',
            visitDate: '23 May 2022',
            visitTime: '9am to 9:29am',
            visitStatus: 'BOOKED',
            visitRestriction: 'OPEN',
            visitors: [
              {
                personId: 4729510,
                name: 'James Smith',
                dateOfBirth: '1983-06-17',
                adult: true,
                relationshipDescription: 'Brother',
                address: 'Warren way,<br>Bootle,<br>DN5 9SD,<br>England',
                restrictions: [],
                banned: false,
              },
            ],
          },
          {
            reference: 'lb-co-bn-oe',
            prisonNumber: 'A8709DY',
            prisonerName: '',
            mainContact: 'Tess Bennett',
            startTimestamp: '2022-05-23T10:00:00',
            endTimestamp: '2022-05-23T11:00:00',
            visitDate: '23 May 2022',
            visitTime: '10am to 11am',
            visitStatus: 'BOOKED',
            visitRestriction: 'OPEN',
            visitors: [
              {
                personId: 4729510,
                name: 'James Smith',
                dateOfBirth: '1983-06-17',
                adult: true,
                relationshipDescription: 'Brother',
                address: 'Warren way,<br>Bootle,<br>DN5 9SD,<br>England',
                restrictions: [],
                banned: false,
              },
              {
                personId: 4729570,
                name: 'Tess Bennett',
                relationshipDescription: 'Aunt',
                address: 'Not entered',
                restrictions: [],
                banned: false,
              },
            ],
          },
        ],
        slots: {
          openSlots: [
            {
              visitTime: '9am to 9:29am',
              visitType: 'OPEN',
              sortField: '2022-05-23T09:00:00',
              adults: 1,
              children: 0,
            },
            {
              visitTime: '10am to 11am',
              visitType: 'OPEN',
              sortField: '2022-05-23T10:00:00',
              adults: 1,
              children: 1,
            },
          ],
          closedSlots: [],
          unknownSlots: [],
          firstSlotTime: '9am to 9:29am',
        },
      }

      expect(visitSchedulerApiClient.getVisitsByDate).toHaveBeenCalledTimes(1)
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(2)
      expect(results).toEqual(resultsCheck)
    })
  })
})
