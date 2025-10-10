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
    it('should get book', async () => {
      const email = 'booker@example.com'
      const bookers = [TestData.bookerSearchResults()]

      orchestrationApiClient.getBookersByEmail.mockResolvedValue(bookers)

      const result = await bookerService.getBookersByEmail(username, email)

      expect(result).toStrictEqual(bookers)
      expect(orchestrationApiClient.getBookersByEmail).toHaveBeenCalledWith(email)
    })
  })
})
