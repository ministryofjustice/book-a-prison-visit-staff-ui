import nock from 'nock'
import config from '../config'
import TestData from '../routes/testutils/testData'
import WhereaboutsApiClient from './whereaboutsApiClient'
import { ScheduledEvent } from './whereaboutsApiTypes'

describe('whereaboutsApiClient', () => {
  let fakeWhereaboutsApi: nock.Scope
  let whereaboutsApiClient: WhereaboutsApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakeWhereaboutsApi = nock(config.apis.whereabouts.url)
    whereaboutsApiClient = new WhereaboutsApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getEvents', () => {
    it('should return an array of events for the offender between the specified dates', async () => {
      const offenderNo = 'A1234BC'
      const fromDate = '2023-03-01'
      const toDate = '2023-03-31'
      const scheduledEvents: ScheduledEvent[] = [TestData.scheduledEvent()]

      fakeWhereaboutsApi
        .get(`/events/${offenderNo}`)
        .query({ fromDate, toDate })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, scheduledEvents)

      const output = await whereaboutsApiClient.getEvents(offenderNo, fromDate, toDate)

      expect(output).toEqual(scheduledEvents)
    })
  })
})
