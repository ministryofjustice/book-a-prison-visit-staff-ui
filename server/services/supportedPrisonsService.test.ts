import SupportedPrisonsService from './supportedPrisonsService'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { createPrisons, createSupportedPrisonIds } from '../data/__testutils/testObjects'
import { PrisonDto } from '../data/prisonRegisterApiTypes'

jest.mock('../data/visitSchedulerApiClient')
jest.mock('../data/prisonRegisterApiClient')

const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>
const prisonRegisterApiClient = new PrisonRegisterApiClient(null) as jest.Mocked<PrisonRegisterApiClient>

describe('Supported prisons service', () => {
  let supportedPrisonsService: SupportedPrisonsService
  let visitSchedulerApiClientBuilder
  let prisonRegisterApiClientBuilder
  let systemToken

  const allPrisons = createPrisons()
  const supportedPrisonIds = createSupportedPrisonIds()

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
    prisonRegisterApiClientBuilder = jest.fn().mockReturnValue(prisonRegisterApiClient)
    supportedPrisonsService = new SupportedPrisonsService(
      visitSchedulerApiClientBuilder,
      prisonRegisterApiClientBuilder,
      systemToken,
    )

    prisonRegisterApiClient.getPrisons.mockResolvedValue(allPrisons as PrisonDto[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSupportedPrison', () => {
    it('should return a supported prison given its prisonId', async () => {
      const results = await supportedPrisonsService.getSupportedPrison('HEI', 'user')
      expect(results).toEqual({ prisonId: 'HEI', prisonName: 'Hewell (HMP)' })
    })

    it('should return undefined for an unsupported prisonId', async () => {
      const results = await supportedPrisonsService.getSupportedPrison('XYZ', 'user')
      expect(results).toBe(undefined)
    })
  })

  describe('getSupportedPrisons', () => {
    it('should return an array of supported prison IDs and names', async () => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toEqual(allPrisons)
    })

    it('should ignore an unknown prison ID', async () => {
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds.concat(['XYZ']))

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toStrictEqual(allPrisons)
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

      expect(results[0]).toEqual(allPrisons)
      expect(results[1]).toEqual(allPrisons)
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

      expect(results[0]).toEqual(allPrisons)
      expect(results[1]).toEqual(allPrisons)
      expect(results[2]).toEqual(allPrisons)
      expect(prisonRegisterApiClient.getPrisons).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })
})
