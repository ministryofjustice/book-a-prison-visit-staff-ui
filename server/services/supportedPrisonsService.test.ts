import SupportedPrisonsService from './supportedPrisonsService'
import prisons from '../constants/prisons'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'

jest.mock('../data/visitSchedulerApiClient')

const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>

describe('Supported prisons service', () => {
  let supportedPrisonsService: SupportedPrisonsService
  let visitSchedulerApiClientBuilder
  let systemToken

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
    supportedPrisonsService = new SupportedPrisonsService(visitSchedulerApiClientBuilder, systemToken)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSupportedPrisons', () => {
    it('should return an array of supported prison IDs and names', async () => {
      const supportedPrisonIds = ['HEI', 'BLI']
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toEqual(prisons)
    })

    it('should ignore an unknown prison ID', async () => {
      const supportedPrisonIds = ['HEI', 'BLI', 'unknown']
      visitSchedulerApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisons('user')

      expect(results).toStrictEqual(prisons)
    })
  })
})
