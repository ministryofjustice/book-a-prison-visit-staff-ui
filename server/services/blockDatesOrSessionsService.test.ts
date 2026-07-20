import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import BlockDatesOrSessionsService from './blockDatesOrSessionsService'

const token = 'some token'
const prisonId = 'HEI'
const username = 'user1'

describe('Blocked dates or sessions service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let blockDatesOrSessionsService: BlockDatesOrSessionsService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    blockDatesOrSessionsService = new BlockDatesOrSessionsService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('blockVisitDate', () => {
    it('should block a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      orchestrationApiClient.blockVisitDate.mockResolvedValue()

      await blockDatesOrSessionsService.blockVisitDate(username, prisonId, date)

      expect(orchestrationApiClient.blockVisitDate).toHaveBeenCalledWith(prisonId, date, username)
    })
  })

  describe('unblockVisitDate', () => {
    it('should unblock a visit date for given prison and send username', async () => {
      const date = '2024-09-06'
      orchestrationApiClient.unblockVisitDate.mockResolvedValue()

      await blockDatesOrSessionsService.unblockVisitDate(username, prisonId, date)

      expect(orchestrationApiClient.unblockVisitDate).toHaveBeenCalledWith(prisonId, date, username)
    })
  })

  describe('isBlockedDate', () => {
    it('should return boolean indicating whether given date is a blocked date', async () => {
      const date = '2000-02-01'
      orchestrationApiClient.isBlockedDate.mockResolvedValue(true)
      const result = await blockDatesOrSessionsService.isBlockedDate(prisonId, date, username)
      expect(orchestrationApiClient.isBlockedDate).toHaveBeenCalledWith(prisonId, date)
      expect(result).toBe(true)
    })

    it('should return false for given date if no exclude date found', async () => {
      const date = '2000-02-01'
      orchestrationApiClient.isBlockedDate.mockResolvedValue(false)

      const result = await blockDatesOrSessionsService.isBlockedDate(prisonId, date, username)

      expect(orchestrationApiClient.isBlockedDate).toHaveBeenCalledWith(prisonId, date)
      expect(result).toStrictEqual(false)
    })
  })

  describe('blockVisitSession', () => {
    it('should block a visit session for given date and send username', async () => {
      const date = '2024-09-06'
      const sessionTemplateReference = 'v9d.7ed.7u'
      orchestrationApiClient.blockVisitSession.mockResolvedValue()

      await blockDatesOrSessionsService.blockVisitSession({ sessionTemplateReference, date, username })

      expect(orchestrationApiClient.blockVisitSession).toHaveBeenCalledWith({
        sessionTemplateReference,
        date,
        username,
      })
    })
  })

  describe('unblockVisitSession', () => {
    it('should unblock a visit session for given date and send username', async () => {
      const date = '2024-09-06'
      const sessionTemplateReference = 'v9d.7ed.7u'
      orchestrationApiClient.unblockVisitSession.mockResolvedValue()

      await blockDatesOrSessionsService.unblockVisitSession({ sessionTemplateReference, date, username })

      expect(orchestrationApiClient.unblockVisitSession).toHaveBeenCalledWith({
        sessionTemplateReference,
        date,
        username,
      })
    })
  })

  describe('getFutureBlockedDatesAndSessions', () => {
    it('should return future blocked dates and sessions for given prison', async () => {
      const prisonAndSessionsExcludeDatesDto = TestData.prisonAndSessionsExcludeDatesDto()
      orchestrationApiClient.getFutureBlockedDatesAndSessions.mockResolvedValue(prisonAndSessionsExcludeDatesDto)

      const result = await blockDatesOrSessionsService.getFutureBlockedDatesAndSessions({
        prisonId,
        includeSessions: true,
        username,
      })

      expect(orchestrationApiClient.getFutureBlockedDatesAndSessions).toHaveBeenCalledWith({
        prisonId,
        includeSessions: true,
      })
      expect(result).toStrictEqual(prisonAndSessionsExcludeDatesDto)
    })
  })
})
