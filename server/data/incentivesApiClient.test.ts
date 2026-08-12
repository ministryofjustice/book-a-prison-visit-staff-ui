import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import IncentivesApiClient from './incentivesApiClient'
import TestData from '../routes/testutils/testData'

describe('incentivesApiClient', () => {
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  let fakeIncentivesApi: nock.Scope
  let incentivesApiClient: IncentivesApiClient

  const prisonId = 'HEI'
  const token = 'token-1'
  const username = 'user'

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<AuthenticationClient>
    fakeIncentivesApi = nock(config.apis.incentives.url)
    incentivesApiClient = new IncentivesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisonIncentivesLevels', () => {
    it('should return data from api', async () => {
      const results = [TestData.prisonIncentiveLevel()]
      fakeIncentivesApi
        .get(`/incentive/prison-levels/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await incentivesApiClient.getPrisonIncentiveLevels(prisonId, username)

      expect(output).toEqual(results)
    })
  })
})
