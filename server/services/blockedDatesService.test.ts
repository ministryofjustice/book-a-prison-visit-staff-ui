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

  describe('unblockVisitDate', () => {
    it('should unblock a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      orchestrationApiClient.unblockVisitDate.mockResolvedValue()

      await blockedDatesService.unblockVisitDate(username, prisonId, date)

      expect(orchestrationApiClient.unblockVisitDate).toHaveBeenCalledWith(prisonId, date, username)
    })
  })

  describe('getFutureBlockedDates', () => {
    it('should return future blocked dates for given prison', async () => {
      const excludeDateDto = TestData.excludeDateDto()
      orchestrationApiClient.getFutureBlockedDates.mockResolvedValue([excludeDateDto])

      const result = await blockedDatesService.getFutureBlockedDates(prisonId, username)

      expect(orchestrationApiClient.getFutureBlockedDates).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual([excludeDateDto])
    })
  })

  describe('isBlockedDate', () => {
    it('should return boolean indicating whether given date is a blocked date', async () => {
      const date = '2000-02-01'
      orchestrationApiClient.isBlockedDate.mockResolvedValue(true)
      const result = await blockedDatesService.isBlockedDate(prisonId, date, username)
      expect(orchestrationApiClient.isBlockedDate).toHaveBeenCalledWith(prisonId, date)
      expect(result).toBe(true)
    })

    it('should return false for given date if no exclude date found', async () => {
      const date = '2000-02-01'
      orchestrationApiClient.isBlockedDate.mockResolvedValue(false)

      const result = await blockedDatesService.isBlockedDate(prisonId, date, username)

      expect(orchestrationApiClient.isBlockedDate).toHaveBeenCalledWith(prisonId, date)
      expect(result).toStrictEqual(false)
    })
  })
})
