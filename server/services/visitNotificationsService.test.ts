import TestData from '../routes/testutils/testData'
import VisitNotificationsService from './visitNotificationsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import { VisitsReviewListItem } from '../@types/bapv'
import { NotificationType } from '../data/orchestrationApiTypes'

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

  describe('getVisitsReviewList', () => {
    it('should return an empty array when there are no notification groups', async () => {
      orchestrationApiClient.getNotificationGroups.mockResolvedValue([])

      const result = await visitNotificationsService.getVisitsReviewList('user', prisonId)

      expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual([])
    })

    describe('Non-association (NON_ASSOCIATION_EVENT)', () => {
      // a NON_ASSOCIATION_EVENT should always have 2 affected visits
      it('should build appropriate visit review list data for a NON_ASSOCIATION_EVENT', async () => {
        const notificationGroup = TestData.notificationGroup({
          type: 'NON_ASSOCIATION_EVENT',
          affectedVisits: [
            {
              prisonerNumber: 'A1234BC',
              bookingReference: 'ab-cd-ef-gh',
              bookedByName: 'User One',
              bookedByUserName: 'user1',
              visitDate: '2023-11-01',
            },
            {
              prisonerNumber: 'A5678CD',
              bookingReference: 'bc-de-fg-hi',
              bookedByName: 'User Two',
              bookedByUserName: 'user2',
              visitDate: '2023-11-01',
            },
          ],
        })

        const listItem: VisitsReviewListItem = {
          bookedByNames: ['User One', 'User Two'],
          prisonerNumbers: ['A1234BC', 'A5678CD'],
          reference: notificationGroup.reference,
          type: 'NON_ASSOCIATION_EVENT',
          visitDates: ['1 November 2023'],
        }

        orchestrationApiClient.getNotificationGroups.mockResolvedValue([notificationGroup])
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result).toStrictEqual([listItem])
      })
    })

    // these event types can have one or more affected visits
    describe.each([
      ['Prisoner released', 'PRISONER_RELEASED_EVENT'],
      ['Visit type changed', 'PRISONER_RESTRICTION_CHANGE_EVENT'],
    ])('%s (%s)', (_: string, type: NotificationType) => {
      it(`should build appropriate visit review list data for a ${type} notification (single visit)`, async () => {
        const notificationGroup = TestData.notificationGroup({
          type,
          affectedVisits: [
            {
              prisonerNumber: 'A1234BC',
              bookingReference: 'ab-cd-ef-gh',
              bookedByName: 'User One',
              bookedByUserName: 'user1',
              visitDate: '2023-11-01',
            },
          ],
        })

        const listItem: VisitsReviewListItem = {
          bookedByNames: ['User One'],
          prisonerNumbers: ['A1234BC'],
          reference: notificationGroup.reference,
          type,
          visitDates: ['1 November 2023'],
        }

        orchestrationApiClient.getNotificationGroups.mockResolvedValue([notificationGroup])
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result).toStrictEqual([listItem])
      })

      it(`should build appropriate visit review list data for a ${type} notification (multiple visit)`, async () => {
        const notificationGroup = TestData.notificationGroup({
          type,
          affectedVisits: [
            {
              prisonerNumber: 'A1234BC',
              bookingReference: 'ab-cd-ef-gh',
              bookedByName: 'User One',
              bookedByUserName: 'user1',
              visitDate: '2023-11-01',
            },
            {
              prisonerNumber: 'A1234BC',
              bookingReference: 'bc-de-fg-hi',
              bookedByName: 'User Two',
              bookedByUserName: 'user2',
              visitDate: '2023-11-10',
            },
          ],
        })

        const listItem: VisitsReviewListItem = {
          bookedByNames: ['User One', 'User Two'],
          prisonerNumbers: ['A1234BC'],
          reference: notificationGroup.reference,
          type,
          visitDates: ['1 November 2023', '10 November 2023'],
        }

        orchestrationApiClient.getNotificationGroups.mockResolvedValue([notificationGroup])
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result).toStrictEqual([listItem])
      })
    })
  })
})
