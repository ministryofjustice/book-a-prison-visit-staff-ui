import TestData from '../routes/testutils/testData'
import VisitNotificationsService from './visitNotificationsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import { Visit } from '../data/orchestrationApiTypes'

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

      expect(orchestrationApiClient.getNotificationCount).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual(notificationCount)
    })
  })

  describe('getVisitNotifications', () => {
    it('should return future visits with notifications for given prison', async () => {
      const visitNotifications = [TestData.visitNotifications()]
      orchestrationApiClient.getVisitNotifications.mockResolvedValue(visitNotifications)

      const result = await visitNotificationsService.getVisitNotifications({ username: 'user', prisonId })

      expect(result).toStrictEqual(visitNotifications)
    })
  })

  describe('dateHasNotifications', () => {
    const date = '2024-04-24'

    const visitNotificationOnDate = TestData.visitNotifications({ visitDate: date })
    const visitNotificationDifferentDate = TestData.visitNotifications()

    beforeEach(() => {
      orchestrationApiClient.getVisitNotifications.mockResolvedValue([
        visitNotificationDifferentDate,
        visitNotificationOnDate,
      ])
    })

    it('should return true if a given date has any visit notifications', async () => {
      const result = await visitNotificationsService.dateHasNotifications('user', prisonId, date)
      expect(orchestrationApiClient.getVisitNotifications).toHaveBeenCalledWith(prisonId)
      expect(result).toBe(true)
    })

    it('should return false if a given date has no visit notifications', async () => {
      const result = await visitNotificationsService.dateHasNotifications('user', prisonId, '2024-04-01')
      expect(orchestrationApiClient.getVisitNotifications).toHaveBeenCalledWith(prisonId)
      expect(result).toBe(false)
    })
  })

  describe('ignoreNotifications', () => {
    it('should ignore notifications for specified visit and set given reason', async () => {
      const reference = 'ab-cd-ef-gh'
      const ignoreVisitNotificationsDto = {
        reason: 'Allow visit to go ahead',
        actionedBy: 'User 1',
      }
      const visit = { reference } as Visit
      orchestrationApiClient.ignoreNotifications.mockResolvedValue(visit)

      const result = await visitNotificationsService.ignoreNotifications({
        username: 'user',
        reference,
        ignoreVisitNotificationsDto,
      })

      expect(orchestrationApiClient.ignoreNotifications).toHaveBeenCalledWith(reference, ignoreVisitNotificationsDto)
      expect(result).toStrictEqual(visit)
    })
  })
})
