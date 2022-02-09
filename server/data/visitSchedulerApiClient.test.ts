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
})
