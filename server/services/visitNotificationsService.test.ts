import TestData from '../routes/testutils/testData'
import VisitNotificationsService from './visitNotificationsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'

const token = 'some token'
const prisonId = 'HEI'

describe('Visit notifications service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let visitNotificationsService: VisitNotificationsService

  const OrchestrationApiClientFactory = jest.fn()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)

    visitNotificationsService = new VisitNotificationsService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getNotificationCount', () => {
    it('should return notification count for given prison', async () => {
      const notificationCount = TestData.notificationCount()
      orchestrationApiClient.getNotificationCount.mockResolvedValue(notificationCount)
      const result = await visitNotificationsService.getNotificationCount('user', prisonId)

      expect(orchestrationApiClient.getNotificationCount).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(notificationCount)
    })
  })
})
