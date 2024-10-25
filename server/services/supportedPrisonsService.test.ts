import SupportedPrisonsService from './supportedPrisonsService'
import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'

const token = 'some token'

describe('Supported prisons service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let supportedPrisonsService: SupportedPrisonsService

  const OrchestrationApiClientFactory = jest.fn()

  const supportedPrisonIds = TestData.supportedPrisonIds()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    supportedPrisonsService = new SupportedPrisonsService(OrchestrationApiClientFactory, hmppsAuthClient)

    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getActiveAgencies', () => {
    it('should return an array of supported prison IDs (without requiring a username)', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getActiveAgencies()

      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith(undefined)
      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisonIds('user')

      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('isSupportedPrison', () => {
    it('should return true if given prisonId is a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison('user', 'HEI')
      expect(result).toBe(true)
    })

    it('should return false if given prisonId is not a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison('user', 'XYZ')
      expect(result).toBe(false)
    })
  })

  describe('getPrison', () => {
    const prison = TestData.prison()

    it('should return a Prison for given prison ID', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      const results = await supportedPrisonsService.getPrison('user', 'HEI')

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI')
      expect(results).toStrictEqual(prison)
    })
  })
})
