import SupportedPrisonsService from './supportedPrisonsService'
import TestData from '../routes/testutils/testData'
import { createMockDataCache, createMockOrchestrationApiClient } from '../data/testutils/mocks'

describe('Supported prisons service', () => {
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const dataCache = createMockDataCache()

  let supportedPrisonsService: SupportedPrisonsService

  const supportedPrisonIds = TestData.supportedPrisonIds()

  beforeEach(() => {
    supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClient, dataCache)
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

      const results = await supportedPrisonsService.getSupportedPrisonIds()

      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('isSupportedPrison', () => {
    it('should return true if given prisonId is a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison('HEI')
      expect(result).toBe(true)
    })

    it('should return false if given prisonId is not a supported prison', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
      const result = await supportedPrisonsService.isSupportedPrison('XYZ')
      expect(result).toBe(false)
    })
  })

  describe('getPrison', () => {
    const prison = TestData.prison()

    it('should return prison config for given prison code if cache hit', async () => {
      dataCache.get.mockResolvedValue(prison)

      expect(await supportedPrisonsService.getPrison(prison.prisonId)).toStrictEqual(prison)

      expect(dataCache.get).toHaveBeenCalledWith(`prison:${prison.prisonId}`)
      expect(dataCache.set).not.toHaveBeenCalled()
      expect(orchestrationApiClient.getPrison).not.toHaveBeenCalled()
    })

    it('should return prison config for given prison code and save to cache if a cache miss', async () => {
      dataCache.get.mockResolvedValue(null)
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      expect(await supportedPrisonsService.getPrison(prison.prisonId)).toStrictEqual(prison)

      expect(dataCache.get).toHaveBeenCalledWith(`prison:${prison.prisonId}`)
      expect(dataCache.set).toHaveBeenCalledWith(`prison:${prison.prisonId}`, prison, 300) // 5 mins
      expect(orchestrationApiClient.getPrison).toHaveBeenCalled()
    })
  })
})
