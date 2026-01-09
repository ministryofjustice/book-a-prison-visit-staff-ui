import TestData from '../../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../../data/testutils/mocks'
import VisitOrdersService from './visitOrdersService'

const token = 'some token'
const username = 'user1'

const prisonId = 'HEI'
const prisonerId = 'A1234BC'

describe('Visit orders service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitOrdersService: VisitOrdersService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitOrdersService = new VisitOrdersService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVoHistory', () => {
    it('should return visit order history for given prisoner', async () => {
      const voHistoryDetails = TestData.visitOrderHistoryDetailsDto()

      orchestrationApiClient.getVoHistory.mockResolvedValue(voHistoryDetails)

      const result = await visitOrdersService.getVoHistory({ username, prisonId, prisonerId })

      expect(result).not.toBe(null) // TODO flesh out test of returned data

      expect(orchestrationApiClient.getVoHistory).toHaveBeenCalledWith({ prisonId, prisonerId })
    })
  })
})
