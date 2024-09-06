import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import BlockedDatesService from './blockedDatesService'

const token = 'some token'
const prisonId = 'HEI'

describe('Block dates service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let blockedDatesService: BlockedDatesService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    blockedDatesService = new BlockedDatesService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getFutureExcludeDates', () => {
    it('should return exclude dates count for given prison', async () => {
      const prisonExcludeDateDto = TestData.prisonExcludeDateDto()
      orchestrationApiClient.getFutureExcludeDates.mockResolvedValue([prisonExcludeDateDto])

      const result = await blockedDatesService.getFutureExcludeDates(prisonId, 'user1')

      expect(orchestrationApiClient.getFutureExcludeDates).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual([prisonExcludeDateDto])
    })
  })
})
