import nock from 'nock'
import config from '../config'
import VisitSchedulerApiClient from './visitSchedulerApiClient'
import { Visit, VisitSession, SessionSchedule } from './orchestrationApiTypes'
import TestData from '../routes/testutils/testData'

describe('visitSchedulerApiClient', () => {
  let fakeVisitSchedulerApi: nock.Scope
  let visitSchedulerApiClient: VisitSchedulerApiClient
  const token = 'token-1'
  const timestamp = new Date().toISOString()
  const prisonId = 'HEI'

  beforeEach(() => {
    fakeVisitSchedulerApi = nock(config.apis.visitScheduler.url)
    visitSchedulerApiClient = new VisitSchedulerApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getVisit', () => {
    it('should return a single matching Visit from the Visit Scheduler API for a valid reference', async () => {
      const reference = 'ab-cd-ef-gh'
      const result = TestData.visit()

      fakeVisitSchedulerApi
        .get(`/visits/${reference}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await visitSchedulerApiClient.getVisit(reference)

      expect(output).toEqual(result)
    })
  })

  describe('getUpcomingVisits', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const offenderNo = 'A1234BC'
      const results: Visit[] = [TestData.visit()]

      jest.useFakeTimers({ advanceTimers: true, now: new Date(timestamp) })

      fakeVisitSchedulerApi
        .get('/visits/search')
        .query({
          prisonerId: offenderNo,
          startDateTime: timestamp,
          visitStatus: 'BOOKED,CANCELLED',
          page: '0',
          size: '1000',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await visitSchedulerApiClient.getUpcomingVisits(offenderNo, ['BOOKED', 'CANCELLED'])

      expect(output).toEqual(results)

      jest.useRealTimers()
    })
  })

  describe('getVisitsByDate', () => {
    it('should return an array of Visit from the Visit Scheduler API', async () => {
      const dateString = '2022-05-06'
      const results: Visit[] = [TestData.visit()]

      fakeVisitSchedulerApi
        .get('/visits/search')
        .query({
          prisonId: 'HEI',
          startDateTime: `${dateString}T00:00:00`,
          endDateTime: `${dateString}T23:59:59`,
          visitStatus: 'BOOKED',
          page: '0',
          size: '1000',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await visitSchedulerApiClient.getVisitsByDate(dateString, prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getVisitSessions', () => {
    it('should return an array of Visit Sessions from the Visit Scheduler API', async () => {
      const results: VisitSession[] = [TestData.visitSession()]

      fakeVisitSchedulerApi
        .get('/visit-sessions')
        .query({
          prisonId: 'HEI',
          prisonerId: 'A1234BC',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await visitSchedulerApiClient.getVisitSessions('A1234BC', prisonId)

      expect(output).toEqual(results)
    })
  })

  describe('getSessionSchedule', () => {
    it('should return an array of scheduled sessions for the specified prison and date', async () => {
      const date = '2023-02-01'
      const sessionSchedule: SessionSchedule[] = [TestData.sessionSchedule()]

      fakeVisitSchedulerApi
        .get('/visit-sessions/schedule')
        .query({ prisonId, date })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, sessionSchedule)

      const output = await visitSchedulerApiClient.getSessionSchedule(prisonId, date)

      expect(output).toEqual(sessionSchedule)
    })
  })

  describe('getVisitSessionCapacity', () => {
    const sessionDate = '2023-01-31'
    const sessionStartTime = '10:00:00'
    const sessionEndTime = '11:00:00'

    it('should return the open and closed capacity for the specified visit session', async () => {
      const sessionCapacity = TestData.sessionCapacity()

      fakeVisitSchedulerApi
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, sessionCapacity)

      const output = await visitSchedulerApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toEqual(sessionCapacity)
    })

    it('should return null if session capacity not available (404 from API)', async () => {
      fakeVisitSchedulerApi
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await visitSchedulerApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toBeNull()
    })

    // API returns 500 IllegalStateException if multiple capacities found for specified date & times
    it('should return null if error retrieving session capacity (500 from API)', async () => {
      fakeVisitSchedulerApi
        .persist() // required because 500 causes server/data/restClient.ts to retry but the mock has been consumed
        .get('/visit-sessions/capacity')
        .query({ prisonId, sessionDate, sessionStartTime, sessionEndTime })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(500)

      const output = await visitSchedulerApiClient.getVisitSessionCapacity(
        prisonId,
        sessionDate,
        sessionStartTime,
        sessionEndTime,
      )

      expect(output).toBeNull()
    })
  })
})
