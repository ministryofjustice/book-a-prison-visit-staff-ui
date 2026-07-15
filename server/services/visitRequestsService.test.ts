import TestData from '../routes/testutils/testData'
import { createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitRequestsService from './visitRequestsService'

const prisonId = 'HEI'

describe('Visit requests service', () => {
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitRequestsService: VisitRequestsService

  beforeEach(() => {
    visitRequestsService = new VisitRequestsService(orchestrationApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('rejectVisitRequest', () => {
    it('should reject a visit request', async () => {
      const reference = 'ab-cd-ef-gh'
      const visitRequestResponse = TestData.visitRequestResponse()
      orchestrationApiClient.rejectVisitRequest.mockResolvedValue(visitRequestResponse)

      const result = await visitRequestsService.rejectVisitRequest('user', reference)

      expect(orchestrationApiClient.rejectVisitRequest).toHaveBeenCalledWith({ username: 'user', reference })
      expect(result).toStrictEqual(visitRequestResponse)
    })
  })

  describe('approveVisitRequest', () => {
    it('should approve a visit request', async () => {
      const reference = 'ab-cd-ef-gh'
      const visitRequestResponse = TestData.visitRequestResponse()
      orchestrationApiClient.approveVisitRequest.mockResolvedValue(visitRequestResponse)

      const result = await visitRequestsService.approveVisitRequest('user', reference)

      expect(orchestrationApiClient.approveVisitRequest).toHaveBeenCalledWith({ username: 'user', reference })
      expect(result).toStrictEqual(visitRequestResponse)
    })
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
      const visitRequestCount = 3
      orchestrationApiClient.getVisitRequestCount.mockResolvedValue(visitRequestCount)

      const result = await visitRequestsService.getVisitRequestCount('user', prisonId)

      expect(orchestrationApiClient.getVisitRequestCount).toHaveBeenCalledWith(prisonId)
      expect(result).toBe(visitRequestCount)
    })
  })
})
