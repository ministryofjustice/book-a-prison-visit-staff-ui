import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import IncentivesApiClient from './incentivesApiClient'
import TestData from '../routes/testutils/testData'

describe('IncentivesApiClient', () => {
  let incentivesApiClient: IncentivesApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  const prisonId = 'HEI'

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    incentivesApiClient = new IncentivesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getPrisonIncentiveLevels', () => {
    it('should return data from api', async () => {
      const results = [TestData.prisonIncentiveLevel()]

      nock(config.apis.incentives.url)
        .get(`/incentive/prison-levels/${prisonId}`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, results)

      const response = await incentivesApiClient.getPrisonIncentiveLevels(prisonId)

      expect(response).toEqual(results)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
