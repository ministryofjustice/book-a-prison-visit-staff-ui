import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import IncentivesApiClient from './incentivesApiClient'
import TestData from '../routes/testutils/testData'

describe('incentivesApiClient', () => {
  let incentivesApiClient: IncentivesApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  let fakeIncentivesApi: nock.Scope

  const token = 'test-system-client'
  const prisonId = 'HEI'

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<AuthenticationClient>

    fakeIncentivesApi = nock(config.apis.incentives.url)

    incentivesApiClient = new IncentivesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  afterAll(() => {
    nock.restore()
  })

  describe('getPrisonIncentiveLevels', () => {
    it('should return data from api', async () => {
      const results = [TestData.prisonIncentiveLevel()]
      fakeIncentivesApi
        .get(`/incentive/prison-levels/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await incentivesApiClient.getPrisonIncentiveLevels(prisonId)

      expect(output).toEqual(results)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
