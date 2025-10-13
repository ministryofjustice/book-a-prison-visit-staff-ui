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

  describe('getBookersByEmail', () => {
    it('should return booker(s) for given email address', async () => {
      const email = 'booker@example.com'
      const bookers = [TestData.bookerSearchResult()]

      orchestrationApiClient.getBookersByEmail.mockResolvedValue(bookers)

      const result = await bookerService.getBookersByEmail({ username, email })

      expect(result).toStrictEqual(bookers)
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
