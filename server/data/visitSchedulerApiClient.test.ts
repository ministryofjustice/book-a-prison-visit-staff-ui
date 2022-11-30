import nock from 'nock'
import { VisitSessionData } from '../@types/bapv'
import config from '../config'
import VisitSchedulerApiClient, { visitSchedulerApiClientBuilder } from './visitSchedulerApiClient'
import {
  SupportType,
  Visit,
  OutcomeDto,
  VisitSession,
  ReserveVisitSlotDto,
  ChangeVisitSlotRequestDto,
} from './visitSchedulerApiTypes'

describe('visitSchedulerApiClient', () => {
  let fakeVisitSchedulerApi: nock.Scope
  let client: VisitSchedulerApiClient
  const token = 'token-1'
  const timestamp = new Date().toISOString()
  const prisonId = 'HEI'

  beforeEach(() => {
    fakeVisitSchedulerApi = nock(config.apis.visitScheduler.url)
    client = visitSchedulerApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      const results = ['HEI', 'BLI']

      fakeVisitSchedulerApi
        .get('/config/prisons/supported')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getSupportedPrisonIds()

      expect(output).toEqual(results)
    })
  })

  describe('getAvailableSupportOptions', () => {
    it('should return an array of available support types', async () => {
      const results: SupportType[] = [
        {
          type: 'WHEELCHAIR',
          description: 'Wheelchair ramp',
        },
        {
          type: 'OTHER',
          description: 'Other',
        },
      ]

      fakeVisitSchedulerApi.get('/visit-support').matchHeader('authorization', `Bearer ${token}`).reply(200, results)

      const output = await client.getAvailableSupportOptions()

      expect(output).toEqual(results)
    })
  })

  describe('getVisit', () => {
    it('should return a single matching Visit from the Visit Scheduler API for a valid reference', async () => {
      const reference = 'ab-cd-ef-gh'
      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'A1234BC',
        prisonId: 'HEI',
        visitRoom: 'A1 L3',
        visitType: 'SOCIAL',
        visitStatus: 'RESERVED',
        visitRestriction: 'OPEN',
        startTimestamp: timestamp,
        endTimestamp: '',
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [
          {
            type: 'OTHER',
            text: 'custom support details',
          },
        ],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      fakeVisitSchedulerApi
        .get(`/visits/${reference}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.getVisit(reference)

      expect(output).toEqual(result)
    })
  })

  describe('getUpcomingVisits', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const offenderNo = 'A1234BC'
      const results: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: offenderNo,
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: timestamp,
          endTimestamp: '',
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [
            {
              type: 'OTHER',
              text: 'custom support details',
            },
          ],
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        },
      ]

      fakeVisitSchedulerApi
        .get('/visits')
        .query({
          prisonerId: offenderNo,
          startTimestamp: timestamp,
          visitStatus: 'BOOKED',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getUpcomingVisits(offenderNo, timestamp)

      expect(output).toEqual(results)
    })
  })

  describe('getPastVisits', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const offenderNo = 'A1234BC'
      const results: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: offenderNo,
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: '',
          endTimestamp: timestamp,
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [
            {
              type: 'OTHER',
              text: 'custom support details',
            },
          ],
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        },
      ]

      fakeVisitSchedulerApi
        .get('/visits')
        .query({
          prisonerId: offenderNo,
          endTimestamp: timestamp,
          visitStatus: 'BOOKED',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPastVisits(offenderNo, timestamp)

      expect(output).toEqual(results)
    })
  })

  describe('getVisitsByDate', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const dateString = '2022-05-06'
      const results: Visit[] = [
        {
          applicationReference: 'aaa-bbb-ccc',
          reference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          visitRoom: 'A1 L3',
          visitType: 'SOCIAL',
          visitStatus: 'RESERVED',
          visitRestriction: 'OPEN',
          startTimestamp: `${dateString}T10:00:00`,
          endTimestamp: '',
          visitNotes: [],
          visitors: [
            {
              nomisPersonId: 1234,
            },
          ],
          visitorSupport: [
            {
              type: 'OTHER',
              text: 'custom support details',
            },
          ],
          createdTimestamp: '2022-02-14T10:00:00',
          modifiedTimestamp: '2022-02-14T10:05:00',
        },
      ]

      fakeVisitSchedulerApi
        .get('/visits')
        .query({
          prisonId: 'HEI',
          startTimestamp: `${dateString}T00:00:00`,
          endTimestamp: `${dateString}T23:59:59`,
          visitStatus: 'BOOKED',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getVisitsByDate(dateString, prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getVisitSessions', () => {
    it('should return an array of Visit Sessions from the Visit Scheduler API', async () => {
      const results: VisitSession[] = [
        {
          sessionTemplateId: 1,
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

      fakeVisitSchedulerApi
        .get('/visit-sessions')
        .query({
          prisonId: 'HEI',
          prisonerId: 'A1234BC',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getVisitSessions('A1234BC', prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('reserveVisit', () => {
    it('should return a new Visit from the Visit Scheduler API', async () => {
      const visitType = 'SOCIAL'
      const visitStatus = 'RESERVED'
      const visitRestriction = 'OPEN'
      const startTimestamp = '2022-02-14T10:00:00'
      const endTimestamp = '2022-02-14T11:00:00'

      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction,
        startTimestamp,
        endTimestamp,
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
      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        prisonId,
        visitSlot: {
          id: '1',
          startTimestamp,
          endTimestamp,
          availableTables: 1,
          visitRoomName: result.visitRoom,
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

      fakeVisitSchedulerApi
        .post('/visits/slot/reserve', <ReserveVisitSlotDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          prisonId,
          visitRoom: visitSessionData.visitSlot.visitRoomName,
          visitType,
          visitRestriction,
          startTimestamp,
          endTimestamp,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
            }
          }),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await client.reserveVisit(visitSessionData)

      expect(output).toStrictEqual(result)
    })
  })

  describe('changeReservedVisit', () => {
    const visitType = 'SOCIAL'
    const visitStatus = 'RESERVED'

    it('should return a changed reserved Visit from the Visit Scheduler, given full visitSessionData', async () => {
      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [],
        visitContact: {
          name: 'John Smith',
          telephone: '01234 567890',
        },
        visitors: [
          {
            nomisPersonId: 1234,
            visitContact: false,
          },
        ],
        visitorSupport: [
          { type: 'WHEELCHAIR' },
          { type: 'MASK_EXEMPT' },
          {
            type: 'OTHER',
            text: 'custom request',
          },
        ],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        prisonId,
        visitSlot: {
          id: '1',
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          capacity: 30,
          visitRoomName: result.visitRoom,
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
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'MASK_EXEMPT' }, { type: 'OTHER', text: 'custom request' }],
        mainContact: {
          phoneNumber: result.visitContact.telephone,
          contactName: result.visitContact.name,
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus,
      }
      const visitContact = {
        telephone: visitSessionData.mainContact.phoneNumber,
        name: visitSessionData.mainContact.contactName,
      }

      fakeVisitSchedulerApi
        .put('/visits/aaa-bbb-ccc/slot/change', <ChangeVisitSlotRequestDto>{
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.changeReservedVisit(visitSessionData)

      expect(output).toEqual(result)
    })

    it('should return an updated reserved Visit from the Visit Scheduler, given minimal visitSessionData', async () => {
      const result: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'AF34567G',
        prisonId,
        visitRoom: 'A1 L3',
        visitType,
        visitStatus,
        visitRestriction: 'OPEN',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
            visitContact: false,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }
      const visitSessionData: VisitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        prisonId,
        visitSlot: {
          id: '1',
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          capacity: 30,
          visitRoomName: result.visitRoom,
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
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus,
      }

      fakeVisitSchedulerApi
        .put('/visits/aaa-bbb-ccc/slot/change', <ChangeVisitSlotRequestDto>{
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact: undefined,
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: false,
            }
          }),
          visitorSupport: undefined,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.changeReservedVisit(visitSessionData)

      expect(output).toEqual(result)
    })
  })

  describe('bookVisit', () => {
    it('should book a Visit (change status from RESERVED to BOOKED), given applicationReference', async () => {
      const applicationReference = 'aaa-bbb-ccc'

      const result: Partial<Visit> = {
        applicationReference,
        reference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      fakeVisitSchedulerApi
        .put(`/visits/${applicationReference}/book`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.bookVisit(applicationReference)

      expect(output).toEqual(result)
    })
  })

  describe('changeBookedVisit', () => {
    it('should return the Visit with new status of RESERVED/CHANGING and new applicationReference, from the Visit Scheduler', async () => {
      const visitType = 'SOCIAL'

      const visitSessionData = <VisitSessionData>{
        prisoner: {
          offenderNo: 'AF34567G',
          name: 'prisoner name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        prisonId,
        visitSlot: {
          id: '1',
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 1,
          visitRoomName: 'A1 L3',
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            personId: 123,
            name: 'visitor name',
            relationshipDescription: 'relationship desc',
            restrictions: [],
            banned: false,
          },
        ],
        visitorSupport: [],
        mainContact: {
          phoneNumber: '01234 567890',
          contactName: 'John Smith',
          contact: {
            personId: 123,
          },
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      const result: Visit = {
        applicationReference: 'ddd-eee-fff',
        reference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType,
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
            nomisPersonId: 123,
            visitContact: true,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '2022-02-14T10:00:00',
        modifiedTimestamp: '2022-02-14T10:05:00',
      }

      fakeVisitSchedulerApi
        .put(`/visits/${visitSessionData.visitReference}/change`, <ReserveVisitSlotDto>{
          prisonerId: visitSessionData.prisoner.offenderNo,
          prisonId,
          visitRoom: visitSessionData.visitSlot.visitRoomName,
          visitType,
          visitRestriction: visitSessionData.visitRestriction,
          startTimestamp: visitSessionData.visitSlot.startTimestamp,
          endTimestamp: visitSessionData.visitSlot.endTimestamp,
          visitContact: {
            name: visitSessionData.mainContact.contactName,
            telephone: visitSessionData.mainContact.phoneNumber,
          },
          visitors: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
              visitContact: true,
            }
          }),
          visitorSupport: visitSessionData.visitorSupport,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await client.changeBookedVisit(visitSessionData)

      expect(output).toStrictEqual(result)
    })
  })

  describe('cancelVisit', () => {
    it('should cancel visit with the specified outcome', async () => {
      const reference = 'ab-cd-ef-gh'

      const outcome: OutcomeDto = {
        outcomeStatus: 'VISITOR_CANCELLED',
        text: 'cancellation reason',
      }

      const result: Visit = {
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
      fakeVisitSchedulerApi
        .put(`/visits/ab-cd-ef-gh/cancel`, outcome)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.cancelVisit(reference, outcome)

      expect(output).toEqual(result)
    })
  })
})
