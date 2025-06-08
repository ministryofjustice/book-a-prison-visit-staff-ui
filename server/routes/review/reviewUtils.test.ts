import { FilterField } from '../../@types/bapv'
import { NotificationType } from '../../data/orchestrationApiTypes'
import TestData from '../testutils/testData'
import { getVisitNotificationFilters } from './reviewUtils'

describe('Visits to review utils', () => {
  describe('getVisitNotificationFilters() - build filter fields for visit notifications', () => {
    const visitNotifications = [
      TestData.visitNotifications({
        bookedByUserName: 'user3',
        bookedByName: 'User C',
        notifications: [TestData.visitNotificationEvent({ type: 'PRISONER_RECEIVED_EVENT' })],
      }),

      TestData.visitNotifications({
        bookedByUserName: 'user1',
        bookedByName: 'User B',
        notifications: [TestData.visitNotificationEvent({ type: 'PRISONER_RELEASED_EVENT' })],
      }),

      TestData.visitNotifications({
        bookedByUserName: 'user2',
        bookedByName: 'User A',
        notifications: [TestData.visitNotificationEvent({ type: 'PRISONER_RELEASED_EVENT' })],
      }),
    ]

    it('should build list filters sorted alphabetically by label - when current user not in list', async () => {
      const username = 'a-different-user'
      const appliedFilters = { bookedBy: <string[]>[], type: <string[]>[] }

      const expectedFilters: FilterField[] = [
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
            { label: 'Prisoner transferred', value: 'PRISONER_RECEIVED_EVENT', checked: false },
          ],
        },
      ]

      const result = getVisitNotificationFilters({ visitNotifications, username, appliedFilters })
      expect(result).toStrictEqual(expectedFilters)
    })

    it('should build list filters sorted alphabetically by label - with current user first', async () => {
      const username = 'user3'
      const appliedFilters = { bookedBy: <string[]>[], type: <string[]>[] }

      const expectedFilters: FilterField[] = [
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
            { label: 'Prisoner transferred', value: 'PRISONER_RECEIVED_EVENT', checked: false },
          ],
        },
      ]

      const result = getVisitNotificationFilters({ visitNotifications, username, appliedFilters })
      expect(result).toStrictEqual(expectedFilters)
    })

    it('should build list filters and handle an unknown event type', async () => {
      const username = 'user'
      const appliedFilters = { bookedBy: <string[]>[], type: <string[]>[] }

      const visitNotificationsWithUnknown = [
        TestData.visitNotifications({
          bookedByUserName: 'user1',
          bookedByName: 'User B',
          notifications: [TestData.visitNotificationEvent({ type: 'UNKNOWN_EVENT_TYPE' as NotificationType })],
        }),
      ]

      const expectedFilters: FilterField[] = [
        {
          id: 'bookedBy',
          label: 'Booked by',
          items: [{ label: 'User B', value: 'user1', checked: false }],
        },
        {
          id: 'type',
          label: 'Reason',
          items: [{ label: 'UNKNOWN_EVENT_TYPE', value: 'UNKNOWN_EVENT_TYPE', checked: false }],
        },
      ]

      const result = getVisitNotificationFilters({
        visitNotifications: visitNotificationsWithUnknown,
        username,
        appliedFilters,
      })
      expect(result).toStrictEqual(expectedFilters)
    })

    it('should build list filters with applied values checked', async () => {
      const username = 'user'
      const appliedFilters = {
        bookedBy: ['user2', 'user3'],
        type: ['PRISONER_RELEASED_EVENT'],
      }

      const expectedFilters: FilterField[] = [
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
            { label: 'Prisoner transferred', value: 'PRISONER_RECEIVED_EVENT', checked: false },
          ],
        },
      ]

      const result = getVisitNotificationFilters({
        visitNotifications,
        username,
        appliedFilters,
      })
      expect(result).toStrictEqual(expectedFilters)
    })

    it('should discard filter values that are not in the unfiltered data', async () => {
      const username = 'user'
      const appliedFilters = {
        bookedBy: ['invalid-user'],
        type: ['INVALID_EVENT'],
        invalid: ['invalid-filter'],
      }

      const expectedFilters: FilterField[] = [
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
            { label: 'Prisoner transferred', value: 'PRISONER_RECEIVED_EVENT', checked: false },
          ],
        },
      ]

      const result = getVisitNotificationFilters({
        visitNotifications,
        username,
        appliedFilters,
      })
      expect(result).toStrictEqual(expectedFilters)
    })
  })
})
