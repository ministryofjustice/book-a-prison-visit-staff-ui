import TestData from '../routes/testutils/testData'
import VisitNotificationsService from './visitNotificationsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import { FilterField, VisitsReviewListItem } from '../@types/bapv'
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
    const noAppliedFilters = {
      bookedBy: <string[]>[],
      type: <string[]>[],
    }

    it('should return an empty array when there are no notification groups', async () => {
      orchestrationApiClient.getNotificationGroups.mockResolvedValue([])

      const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, noAppliedFilters)

      expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
      expect(result).toStrictEqual({ filters: [], visitsReviewList: [] })
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
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, noAppliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual([listItem])
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
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, noAppliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual([listItem])
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
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, noAppliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual([listItem])
      })
    })

    describe('Visits review list filtering', () => {
      const notificationGroups = [
        TestData.notificationGroup(),
        TestData.notificationGroup({
          type: 'PRISONER_RELEASED_EVENT',
          affectedVisits: [
            TestData.notificationVisitInfo({ bookedByUserName: 'user2', bookedByName: 'User Two' }),
            TestData.notificationVisitInfo({ bookedByUserName: 'user3', bookedByName: 'User Three' }),
          ],
        }),
      ]

      it('should filter visit review list data using applied filter - single filter, one value', async () => {
        const appliedFilters = {
          bookedBy: ['user1'],
          type: <string[]>[],
        }

        const listItems: VisitsReviewListItem[] = [
          {
            bookedByNames: ['User One', 'User Two'],
            prisonerNumbers: ['A1234BC', 'A5678DE'],
            reference: 'ab*cd*ef*gh',
            type: 'NON_ASSOCIATION_EVENT',
            visitDates: ['1 November 2023'],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, appliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual(listItems)
      })

      it('should filter visit review list data using applied filter - single filter, multiple values', async () => {
        const appliedFilters = {
          bookedBy: ['user1', 'user3'],
          type: <string[]>[],
        }

        const listItems: VisitsReviewListItem[] = [
          {
            bookedByNames: ['User One', 'User Two'],
            prisonerNumbers: ['A1234BC', 'A5678DE'],
            reference: 'ab*cd*ef*gh',
            type: 'NON_ASSOCIATION_EVENT',
            visitDates: ['1 November 2023'],
          },
          {
            bookedByNames: ['User Two', 'User Three'],
            prisonerNumbers: ['A1234BC'],
            reference: 'ab*cd*ef*gh',
            type: 'PRISONER_RELEASED_EVENT',
            visitDates: ['1 November 2023', '1 November 2023'],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, appliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual(listItems)
      })

      it('should filter visit review list data using applied filter - two filters', async () => {
        const appliedFilters = {
          bookedBy: ['user1'],
          type: ['PRISONER_RELEASED_EVENT'],
        }

        const listItems: VisitsReviewListItem[] = [
          {
            bookedByNames: ['User One', 'User Two'],
            prisonerNumbers: ['A1234BC', 'A5678DE'],
            reference: 'ab*cd*ef*gh',
            type: 'NON_ASSOCIATION_EVENT',
            visitDates: ['1 November 2023'],
          },
          {
            bookedByNames: ['User Two', 'User Three'],
            prisonerNumbers: ['A1234BC'],
            reference: 'ab*cd*ef*gh',
            type: 'PRISONER_RELEASED_EVENT',
            visitDates: ['1 November 2023', '1 November 2023'],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList('user', prisonId, appliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.visitsReviewList).toStrictEqual(listItems)
      })
    })

    describe('Visits review list filter fields', () => {
      const notificationGroups = [
        TestData.notificationGroup({
          type: 'PRISONER_RESTRICTION_CHANGE_EVENT',
          affectedVisits: [TestData.notificationVisitInfo({ bookedByUserName: 'user3', bookedByName: 'User C' })],
        }),
        TestData.notificationGroup({
          type: 'PRISONER_RELEASED_EVENT',
          affectedVisits: [
            TestData.notificationVisitInfo({ bookedByUserName: 'user1', bookedByName: 'User B' }),
            TestData.notificationVisitInfo({ bookedByUserName: 'user2', bookedByName: 'User A' }),
          ],
        }),
      ]

      it('should build list filters sorted alphabetically by label - when current user not in list', async () => {
        const user = 'user'

        const filters: FilterField[] = [
          {
            id: 'bookedBy',
            label: 'Booked by',
            items: [
              { label: 'User A', value: 'user2', checked: false },
              { label: 'User B', value: 'user1', checked: false },
              { label: 'User C', value: 'user3', checked: false },
            ],
          },
          {
            id: 'type',
            label: 'Reason',
            items: [
              { label: 'Prisoner released', value: 'PRISONER_RELEASED_EVENT', checked: false },
              { label: 'Visit type changed', value: 'PRISONER_RESTRICTION_CHANGE_EVENT', checked: false },
            ],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList(user, prisonId, noAppliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.filters).toStrictEqual(filters)
      })

      it('should build list filters sorted alphabetically by label - with current user first', async () => {
        const user = 'user3'

        const filters: FilterField[] = [
          {
            id: 'bookedBy',
            label: 'Booked by',
            items: [
              { label: 'User C', value: 'user3', checked: false },
              { label: 'User A', value: 'user2', checked: false },
              { label: 'User B', value: 'user1', checked: false },
            ],
          },
          {
            id: 'type',
            label: 'Reason',
            items: [
              { label: 'Prisoner released', value: 'PRISONER_RELEASED_EVENT', checked: false },
              { label: 'Visit type changed', value: 'PRISONER_RESTRICTION_CHANGE_EVENT', checked: false },
            ],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList(user, prisonId, noAppliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.filters).toStrictEqual(filters)
      })

      it('should build list filters with applied values checked', async () => {
        const user = 'user'
        const appliedFilters = {
          bookedBy: ['user2', 'user3'],
          type: ['PRISONER_RELEASED_EVENT'],
        }

        const filters: FilterField[] = [
          {
            id: 'bookedBy',
            label: 'Booked by',
            items: [
              { label: 'User A', value: 'user2', checked: true },
              { label: 'User B', value: 'user1', checked: false },
              { label: 'User C', value: 'user3', checked: true },
            ],
          },
          {
            id: 'type',
            label: 'Reason',
            items: [
              { label: 'Prisoner released', value: 'PRISONER_RELEASED_EVENT', checked: true },
              { label: 'Visit type changed', value: 'PRISONER_RESTRICTION_CHANGE_EVENT', checked: false },
            ],
          },
        ]

        orchestrationApiClient.getNotificationGroups.mockResolvedValue(notificationGroups)
        const result = await visitNotificationsService.getVisitsReviewList(user, prisonId, appliedFilters)

        expect(orchestrationApiClient.getNotificationGroups).toHaveBeenCalledWith(prisonId)
        expect(result.filters).toStrictEqual(filters)
      })
    })
  })
})
