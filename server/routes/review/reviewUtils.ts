import { FilterField } from '../../@types/bapv'
import { notificationTypes } from '../../constants/notifications'
import { NotificationType, VisitNotifications } from '../../data/orchestrationApiTypes'

export type AppliedFilters = Record<'bookedBy' | 'type', string[]>

export type VisitToReviewListItem = {
  bookedByName: string
  prisonerNumber: string
  visitReference: string
  notifications: { key: NotificationType; value: string }[]
  visitDate: string
}

export const getVisitNotificationFilters = ({
  visitNotifications,
  username,
  appliedFilters,
}: {
  visitNotifications: VisitNotifications[]
  username: string
  appliedFilters: AppliedFilters
}): FilterField[] => {
  // get unique username and notification types
  const usernames = new Map<string, string>()
  const types = new Map<NotificationType, string>()
  visitNotifications.forEach(visitNotification => {
    usernames.set(visitNotification.bookedByUserName, visitNotification.bookedByName)
    visitNotification.notifications.forEach(notification =>
      types.set(notification.type, notificationTypes[notification.type]),
    )
  })

  // build filter field items from unique values
  const bookedByItems: FilterField['items'] = []
  usernames.forEach((label, value) =>
    bookedByItems.push({ label, value, checked: appliedFilters.bookedBy.includes(value) }),
  )
  const typeItems: FilterField['items'] = []
  types.forEach((label, value) =>
    typeItems.push({ label: label || value, value, checked: appliedFilters.type.includes(value) }),
  )

  // sort field labels alphabetically (with current user at top, if present)
  bookedByItems.sort((a, b) => {
    if (a.value === username) return -1
    if (b.value === username) return 1
    return a.label.localeCompare(b.label)
  })
  typeItems.sort((a, b) => a.label.localeCompare(b.label))

  return [
    { id: 'bookedBy', label: 'Booked by', items: bookedByItems },
    { id: 'type', label: 'Reason', items: typeItems },
  ]
}

export const filterVisitNotifications = ({
  appliedFilters,
  visitNotifications,
}: {
  appliedFilters: AppliedFilters
  visitNotifications: VisitNotifications[]
}): VisitNotifications[] => {
  const { bookedBy, type } = appliedFilters

  if (!bookedBy.length && !type.length) {
    return visitNotifications
  }

  return visitNotifications.filter(visitNotification => {
    const isUserNameMatch = bookedBy.includes(visitNotification.bookedByUserName)

    const isNotificationTypeMatch = visitNotification.notifications.some(notification =>
      type.includes(notification.type),
    )

    const bothFiltersApplied = bookedBy.length && type.length
    const matchesBothFilters = isUserNameMatch && isNotificationTypeMatch
    const matchesOneFilter = isUserNameMatch || isNotificationTypeMatch

    return bothFiltersApplied ? matchesBothFilters : matchesOneFilter
  })
}

export const buildVisitsToReviewList = (visitNotifications: VisitNotifications[]): VisitToReviewListItem[] => {
  return visitNotifications.map(visitNotification => {
    const uniqueNotifications = new Map<NotificationType, string>()
    visitNotification.notifications.forEach(notification =>
      uniqueNotifications.set(notification.type, notificationTypes[notification.type] || notification.type),
    )

    const notifications = Array.from(uniqueNotifications).map(notification => {
      return { key: notification[0], value: notification[1] }
    })

    notifications.sort((a, b) => a.value.localeCompare(b.value))

    return {
      bookedByName: visitNotification.bookedByName,
      prisonerNumber: visitNotification.prisonerNumber,
      visitReference: visitNotification.visitReference,
      notifications,
      visitDate: visitNotification.visitDate,
    }
  })
}
