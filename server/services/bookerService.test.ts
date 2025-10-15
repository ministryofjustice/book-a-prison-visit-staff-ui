import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import BookerService from './bookerService'

const token = 'some token'
const username = 'user1'

describe('Booker service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let bookerService: BookerService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    bookerService = new BookerService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSortedBookersByEmail', () => {
    it('should return booker(s) for given email address sorted by created date descending', async () => {
      const email = 'booker@example.com'
      const activeBookerAccount = TestData.bookerSearchResult({
        reference: 'active-booker',
        createdTimestamp: '2025-10-09T12:00:00',
      })
      const bookerWithEarlierCreatedDate = TestData.bookerSearchResult({
        reference: 'old-booker-account',
        createdTimestamp: '2024-10-09T12:00:00',
      })

      orchestrationApiClient.getBookersByEmail.mockResolvedValue([bookerWithEarlierCreatedDate, activeBookerAccount])

      const result = await bookerService.getSortedBookersByEmail({ username, email })

      expect(result).toStrictEqual([activeBookerAccount, bookerWithEarlierCreatedDate])
      expect(orchestrationApiClient.getBookersByEmail).toHaveBeenCalledWith(email)
    })
  })

  describe('getBookerDetails', () => {
    it('should return booker details for given booker reference', async () => {
      const booker = TestData.bookerDetailedInfo()
      const { reference } = booker

      orchestrationApiClient.getBookerDetails.mockResolvedValue(booker)

      const result = await bookerService.getBookerDetails({ username, reference })

      expect(result).toStrictEqual(booker)
      expect(orchestrationApiClient.getBookerDetails).toHaveBeenCalledWith(reference)
    })
  })
})
