import nock from 'nock'
import config from '../config'
import TestData from '../routes/testutils/testData'
import OrchestrationApiClient from './orchestrationApiClient'

describe('orchestrationApiClient', () => {
  let fakeOrchestrationApi: nock.Scope
  let orchestrationApiClient: OrchestrationApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakeOrchestrationApi = nock(config.apis.orchestration.url)
    orchestrationApiClient = new OrchestrationApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getVisitHistory', () => {
    it('should return visit history details for requested visit', async () => {
      const visitHistoryDetails = TestData.visitHistoryDetails()

      fakeOrchestrationApi
        .get(`/visits/${visitHistoryDetails.visit.reference}/history`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitHistoryDetails)

      const output = await orchestrationApiClient.getVisitHistory(visitHistoryDetails.visit.reference)

      expect(output).toEqual(visitHistoryDetails)
    })
  })

  describe('getPrisonerProfile', () => {
    it('should return prisoner profile page for selected prisoner', async () => {
      const fullPrisoner = TestData.prisonerProfile()
      const prisonId = 'HEI'

      fakeOrchestrationApi
        .get(`/prisoner/${prisonId}/${fullPrisoner.prisonerId}/profile`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, fullPrisoner)

      const output = await orchestrationApiClient.getPrisonerProfile(prisonId, fullPrisoner.prisonerId)

      expect(output).toEqual(fullPrisoner)
    })
  })
})
