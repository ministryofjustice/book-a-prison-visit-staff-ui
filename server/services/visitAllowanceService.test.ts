import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockIncentivesApiClient } from '../data/testutils/mocks'
import VisitAllowanceService from './visitAllowanceService'

const token = 'some token'

describe('Visit allowance service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const incentivesApiClient = createMockIncentivesApiClient()

  let visitAllowanceService: VisitAllowanceService

  const IncentivesApiClientFactory = jest.fn()

  beforeEach(() => {
    IncentivesApiClientFactory.mockReturnValue(incentivesApiClient)
    visitAllowanceService = new VisitAllowanceService(IncentivesApiClientFactory, hmppsAuthClient)

    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonIncentiveLevels', () => {
    const prisonIncentiveLevels = [TestData.prisonIncentiveLevel()]

    it('should return a list of prison incentive levels', async () => {
      incentivesApiClient.getPrisonIncentiveLevels.mockResolvedValue(prisonIncentiveLevels)

      const results = await visitAllowanceService.getPrisonIncentiveLevels({ username: 'user', prisonId: 'HEI' })

      expect(incentivesApiClient.getPrisonIncentiveLevels).toHaveBeenCalledWith('HEI')
      expect(results).toStrictEqual(prisonIncentiveLevels)
    })
  })
})
