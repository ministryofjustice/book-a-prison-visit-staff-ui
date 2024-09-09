import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import BlockedDatesService from './blockedDatesService'

const token = 'some token'
const prisonId = 'HEI'
const username = 'user1'

describe('Blocked dates service', () => {
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

  describe('blockVisitDate', () => {
    it('should block a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      orchestrationApiClient.blockVisitDate.mockResolvedValue()

      await blockedDatesService.blockVisitDate(username, prisonId, date)

      expect(orchestrationApiClient.blockVisitDate).toHaveBeenCalledWith(prisonId, date, username)
    })
  })

  describe('getFutureBlockedDates', () => {
    it('should return future blocked dates for given prison', async () => {
      const prisonExcludeDateDto = TestData.prisonExcludeDateDto()
      orchestrationApiClient.getFutureBlockedDates.mockResolvedValue([prisonExcludeDateDto])

      const result = await blockedDatesService.getFutureBlockedDates(prisonId, username)

      expect(orchestrationApiClient.getFutureBlockedDates).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual([prisonExcludeDateDto])
    })
  })
})
