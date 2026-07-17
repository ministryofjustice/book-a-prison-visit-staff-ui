import TestData from '../routes/testutils/testData'
import { createMockIncentivesApiClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitAllowanceService from './visitAllowanceService'

describe('Visit allowance service', () => {
  const incentivesApiClient = createMockIncentivesApiClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitAllowanceService: VisitAllowanceService

  beforeEach(() => {
    visitAllowanceService = new VisitAllowanceService(incentivesApiClient, orchestrationApiClient)
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

  describe('getRemandConfig', () => {
    const prison = TestData.prison()
    const remandConfig = TestData.prisonRemandConfig()

    it('should return remand config for current prison', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      const results = await visitAllowanceService.getRemandConfig({ username: 'user', prisonId: 'HEI' })

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI')
      expect(results).toStrictEqual(remandConfig)
    })
  })

  describe('updateRemandConfig', () => {
    it('should update remand config for current prison', async () => {
      orchestrationApiClient.updatePrisonConfig.mockResolvedValue()

      await visitAllowanceService.updateRemandConfig({
        username: 'user',
        prisonId: 'HEI',
        remandVisitLimitPerWeek: 5,
        weekStartDay: 'SUNDAY',
      })

      expect(orchestrationApiClient.updatePrisonConfig).toHaveBeenCalledWith({
        prisonId: 'HEI',
        visitSchedulerUpdatePrisonDto: { weekStartDay: 'SUNDAY', remandVisitLimitPerWeek: 5 },
      })
    })
  })
})
