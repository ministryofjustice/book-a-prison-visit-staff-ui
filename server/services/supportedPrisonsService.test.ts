import SupportedPrisonsService from './supportedPrisonsService'
import TestData from '../routes/testutils/testData'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonRegisterApiClient,
} from '../data/testutils/mocks'

const token = 'some token'

describe('Supported prisons service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonRegisterApiClient = createMockPrisonRegisterApiClient()

  let supportedPrisonsService: SupportedPrisonsService

  const OrchestrationApiClientFactory = jest.fn()
  const PrisonRegisterApiClientFactory = jest.fn()

  const prisonNames = TestData.prisonNames()
  const supportedPrisons = TestData.supportedPrisons()
  const supportedPrisonIds = TestData.supportedPrisonIds()
  const prisonDto = TestData.prisonDto()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    PrisonRegisterApiClientFactory.mockReturnValue(prisonRegisterApiClient)
    supportedPrisonsService = new SupportedPrisonsService(
      OrchestrationApiClientFactory,
      PrisonRegisterApiClientFactory,
      hmppsAuthClient,
    )

    prisonRegisterApiClient.getPrisonNames.mockResolvedValue(prisonNames)
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

  describe('getSupportedPrisons', () => {
    it('should return an object with key/values of supported prison IDs and names', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toEqual(supportedPrisons)
    })

    it('should ignore an unknown prison ID', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds.concat(['XYZ']))

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toStrictEqual(supportedPrisons)
    })
  })

  describe('getPrisonConfig', () => {
    it('should return some prison config values (maxTotalVisitors, policyNoticeDaysMin) when called with a prison ID', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prisonDto)

      const results = await supportedPrisonsService.getPrisonConfig('user', 'HEI')

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI')
      expect(results).toStrictEqual({
        maxTotalVisitors: prisonDto.maxTotalVisitors,
        policyNoticeDaysMin: prisonDto.policyNoticeDaysMin,
      })
    })
  })

  describe('isAnExcludeDate', () => {
    const excludeDate = '2024-04-22'
    const notAnExcludeDate = '2024-04-23'
    const prisonDtoWithExcludeDate = TestData.prisonDto({ excludeDates: [excludeDate] })

    it('should return true if the given date is an exclude date for the given prison', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prisonDtoWithExcludeDate)

      const results = await supportedPrisonsService.isAnExcludeDate('user', 'HEI', excludeDate)

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI')
      expect(results).toBe(true)
    })

    it('should return false if the given date is not an exclude date for the given prison', async () => {
      orchestrationApiClient.getPrison.mockResolvedValue(prisonDtoWithExcludeDate)

      const results = await supportedPrisonsService.isAnExcludeDate('user', 'HEI', notAnExcludeDate)

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith('HEI')
      expect(results).toBe(false)
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

  describe('API response caching', () => {
    beforeEach(() => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
    })

    it('should call API to get all prisons once then use internal cache for subsequent calls', async () => {
      const results = []

      results[0] = await supportedPrisonsService.getSupportedPrisons('user')
      results[1] = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results[0]).toEqual(supportedPrisons)
      expect(results[1]).toEqual(supportedPrisons)
      expect(prisonRegisterApiClient.getPrisonNames).toHaveBeenCalledTimes(1)
    })

    it('should refresh internal cache of all prisons after 24 hours', async () => {
      jest.useFakeTimers()

      const A_DAY_IN_MS = 24 * 60 * 60 * 1000
      const results = []

      results[0] = await supportedPrisonsService.getSupportedPrisons('user')
      results[1] = await supportedPrisonsService.getSupportedPrisons('user')
      jest.advanceTimersByTime(A_DAY_IN_MS)
      results[2] = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results[0]).toEqual(supportedPrisons)
      expect(results[1]).toEqual(supportedPrisons)
      expect(results[2]).toEqual(supportedPrisons)
      expect(prisonRegisterApiClient.getPrisonNames).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })
})
