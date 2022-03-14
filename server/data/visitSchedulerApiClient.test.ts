import nock from 'nock'
import config from '../config'
import VisitSchedulerApiClient, { visitSchedulerApiClientBuilder } from './visitSchedulerApiClient'

describe('visitSchedulerApiClient', () => {
  let fakeVisitSchedulerApi: nock.Scope
  let client: VisitSchedulerApiClient
  const token = 'token-1'
  const timestamp = new Date().toISOString()

  beforeEach(() => {
    fakeVisitSchedulerApi = nock(config.apis.visitScheduler.url)
    client = visitSchedulerApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUpcomingVisits', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const offenderNo = 'A1234BC'
      const results = [
        {
          id: 123,
          prisonerId: offenderNo,
          prisonId: 'MDI',
          visitRoom: 'A1 L3',
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
          visitStatus: 'RESERVED',
          visitStatusDescription: 'Reserved',
          startTimestamp: timestamp,
          endTimestamp: '',
          reasonableAdjustments: 'string',
          visitors: [
            {
              visitId: 123,
              nomisPersonId: 1234,
              leadVisitor: true,
            },
          ],
          sessionId: 123,
        },
      ]

      fakeVisitSchedulerApi
        .get('/visits')
        .query({
          prisonId: 'HEI',
          prisonerId: offenderNo,
          startTimestamp: timestamp,
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
      const results = [
        {
          id: 123,
          prisonerId: offenderNo,
          prisonId: 'MDI',
          visitRoom: 'A1 L3',
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
          visitStatus: 'RESERVED',
          visitStatusDescription: 'Reserved',
          startTimestamp: '',
          endTimestamp: timestamp,
          reasonableAdjustments: 'string',
          visitors: [
            {
              visitId: 123,
              nomisPersonId: 1234,
              leadVisitor: true,
            },
          ],
          sessionId: 123,
        },
      ]

      fakeVisitSchedulerApi
        .get('/visits')
        .query({
          prisonId: 'HEI',
          prisonerId: offenderNo,
          endTimestamp: timestamp,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPastVisits(offenderNo, timestamp)

      expect(output).toEqual(results)
    })
  })

  describe('getVisitSessions', () => {
    it('should return an array of Visit Sessions from the Visit Scheduler API', async () => {
      const results = [
        {
          sessionTemplateId: 1,
          visitRoomName: 'A1',
          visitType: 'STANDARD_SOCIAL',
          visitTypeDescription: 'Standard Social',
          prisonId: 'HEI',
          restrictions: 'restrictions test',
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
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getVisitSessions()

      expect(output).toEqual(results)
    })
  })

  describe('createVisit', () => {
    it('should return a new Visit from the Visit Scheduler API', async () => {
      const prisonId = 'HEI'
      const visitType = 'STANDARD_SOCIAL'
      const visitStatus = 'RESERVED'
      const result = {
        id: 123,
        prisonerId: 'AF34567G',
        prisonId,
        visitRoom: 'A1 L3',
        visitType,
        visitTypeDescription: 'Standard Social',
        visitStatus,
        visitStatusDescription: 'Reserved',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        reasonableAdjustments: 'string',
        visitorConcerns: 'string',
        mainContact: {
          visitId: 123,
          contactName: 'John Smith',
          contactPhone: '01234 567890',
        },
        visitors: [
          {
            visitId: 123,
            nomisPersonId: 1234,
            leadVisitor: true,
          },
        ],
        sessionId: 123,
      }
      const visitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'pri name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visit: {
          id: 'visitId',
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          visitRoomName: result.visitRoom,
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
          },
        ],
      }

      fakeVisitSchedulerApi
        .post('/visits', {
          prisonId,
          prisonerId: visitSessionData.prisoner.offenderNo,
          startTimestamp: visitSessionData.visit.startTimestamp,
          endTimestamp: visitSessionData.visit.endTimestamp,
          visitType,
          visitStatus,
          visitRoom: visitSessionData.visit.visitRoomName,
          contactList: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
            }
          }),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.createVisit(visitSessionData)

      expect(output).toEqual(result)
    })
  })

  describe('updateVisit', () => {
    it('should return an updated Visit from the Visit Scheduler API', async () => {
      const prisonId = 'HEI'
      const visitType = 'STANDARD_SOCIAL'
      const visitStatus = 'RESERVED'
      const result = {
        id: 123,
        prisonerId: 'AF34567G',
        prisonId,
        visitRoom: 'A1 L3',
        visitType,
        visitTypeDescription: 'Standard Social',
        visitStatus,
        visitStatusDescription: 'Reserved',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        reasonableAdjustments: 'wheelchair,maskExempt,other,custom request',
        visitorConcerns: '',
        mainContact: {
          visitId: 123,
          contactName: 'John Smith',
          contactPhone: '01234 567890',
        },
        visitors: [
          {
            visitId: 123,
            nomisPersonId: 1234,
            leadVisitor: true,
          },
        ],
        sessionId: 123,
      }
      const visitSessionData = {
        prisoner: {
          offenderNo: result.prisonerId,
          name: 'pri name',
          dateOfBirth: '23 May 1988',
          location: 'somewhere',
        },
        visit: {
          id: 'visitId',
          startTimestamp: result.startTimestamp,
          endTimestamp: result.endTimestamp,
          availableTables: 1,
          visitRoomName: result.visitRoom,
        },
        additionalSupport: {
          required: true,
          keys: ['wheelchair', 'maskExempt', 'other'],
          other: 'custom request',
        },
        mainContact: {
          phoneNumber: result.mainContact.contactPhone,
          contactName: result.mainContact.contactName,
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
          },
        ],
        booking: {
          reservationId: '123',
        },
      }
      const mainContact = {
        contactPhone: visitSessionData.mainContact.phoneNumber,
        contactName: visitSessionData.mainContact.contactName,
      }
      const additionalSupport = visitSessionData.additionalSupport?.keys
        ? visitSessionData.additionalSupport.keys.concat([visitSessionData.additionalSupport.other]).join(',')
        : ''

      fakeVisitSchedulerApi
        .put('/visits/123', {
          prisonId,
          prisonerId: visitSessionData.prisoner.offenderNo,
          startTimestamp: visitSessionData.visit.startTimestamp,
          endTimestamp: visitSessionData.visit.endTimestamp,
          visitType,
          visitStatus,
          visitRoom: visitSessionData.visit.visitRoomName,
          reasonableAdjustments: additionalSupport,
          mainContact,
          contactList: visitSessionData.visitors.map(visitor => {
            return {
              nomisPersonId: visitor.personId,
            }
          }),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await client.updateVisit(visitSessionData, visitStatus)

      expect(output).toEqual(result)
    })
  })
})
