import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitRequestsService from './visitRequestsService'

const token = 'some token'
const prisonId = 'HEI'

describe('Visit requests service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitRequestsService: VisitRequestsService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitRequestsService = new VisitRequestsService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVisitRequestCount', () => {
    it('should return visit request summaries for given prison', async () => {
      const visitRequests = [TestData.visitRequestSummary()]
      orchestrationApiClient.getVisitRequests.mockResolvedValue(visitRequests)

      const result = await visitRequestsService.getVisitRequests('user', prisonId)

      expect(orchestrationApiClient.getVisitRequests).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual(visitRequests)
    })
  })

  describe('getVisitRequestCount', () => {
    it('should return visit request count for given prison', async () => {
      const visitRequestCount = TestData.visitRequestCount()
      orchestrationApiClient.getVisitRequestCount.mockResolvedValue(visitRequestCount)

      const result = await visitRequestsService.getVisitRequestCount('user', prisonId)

      expect(orchestrationApiClient.getVisitRequestCount).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual(visitRequestCount)
    })
  })
})
