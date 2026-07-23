import SupportedPrisonsService from './supportedPrisonsService'
import TestData from '../routes/testutils/testData'
import { createMockOrchestrationApiClient } from '../data/testutils/mocks'

const username = 'user'

describe('Supported prisons service', () => {
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let supportedPrisonsService: SupportedPrisonsService

  const supportedPrisonIds = TestData.supportedPrisonIds()

  beforeEach(() => {
    supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getActiveAgencies', () => {
    it('should return an array of supported prison IDs (without requiring a username)', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getActiveAgencies()

      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisonIds(username)

      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('isSupportedPrison', () => {
    it('should return true if given prisonId is a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison(username, 'HEI')
      expect(result).toBe(true)
    })

    it('should return false if given prisonId is not a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison(username, 'XYZ')
      expect(result).toBe(false)
    })
  })

  describe('getPrison', () => {
    const prison = TestData.prison()

    it('should return a Prison for given prison ID', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      const results = await supportedPrisonsService.getPrison(username, 'HEI')

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI', username)
      expect(results).toStrictEqual(prison)
    })
  })
})
