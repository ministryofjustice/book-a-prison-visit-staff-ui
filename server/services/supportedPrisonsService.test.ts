import SupportedPrisonsService from './supportedPrisonsService'
import TestData from '../routes/testutils/testData'
import { PrisonDto } from '../data/prisonRegisterApiTypes'
import {
  createMockHmppsAuthClient,
  createMockPrisonRegisterApiClient,
  createMockVisitSchedulerApiClient,
} from '../data/testutils/mocks'

const token = 'some token'

describe('Supported prisons service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const prisonRegisterApiClient = createMockPrisonRegisterApiClient()
  const visitSchedulerApiClient = createMockVisitSchedulerApiClient()

  let supportedPrisonsService: SupportedPrisonsService

  const PrisonRegisterApiClientFactory = jest.fn()
  const VisitSchedulerApiClientFactory = jest.fn()

  const allPrisons = TestData.prisons()
  const supportedPrisons = TestData.supportedPrisons()
  const supportedPrisonIds = TestData.supportedPrisonIds()

  beforeEach(() => {
    PrisonRegisterApiClientFactory.mockReturnValue(prisonRegisterApiClient)
    VisitSchedulerApiClientFactory.mockReturnValue(visitSchedulerApiClient)
    supportedPrisonsService = new SupportedPrisonsService(
      VisitSchedulerApiClientFactory,
      PrisonRegisterApiClientFactory,
      hmppsAuthClient,
    )

    prisonRegisterApiClient.getPrisons.mockResolvedValue(allPrisons as PrisonDto[])
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSupportedPrisons', () => {
    it('should return an object with key/values of supported prison IDs and names', async () => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toEqual(supportedPrisons)
    })

    it('should ignore an unknown prison ID', async () => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds.concat(['XYZ']))

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toStrictEqual(supportedPrisons)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisonIds('user')

      expect(visitSchedulerApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })

  describe('API response caching', () => {
    beforeEach(() => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
    })

    it('should call API to get all prisons once then use internal cache for subsequent calls', async () => {
      const results = []

      results[0] = await supportedPrisonsService.getSupportedPrisons('user')
      results[1] = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results[0]).toEqual(supportedPrisons)
      expect(results[1]).toEqual(supportedPrisons)
      expect(prisonRegisterApiClient.getPrisons).toHaveBeenCalledTimes(1)
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
      expect(prisonRegisterApiClient.getPrisons).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })
})
