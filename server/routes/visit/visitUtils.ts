import {
  NotificationType,
  VisitBookingDetails,
  VisitNotificationEventAttributeNames,
} from '../../data/orchestrationApiTypes'

export const getPrisonerLocation = (prisoner: VisitBookingDetails['prisoner']) => {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }

  if (prisoner.prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${prisoner.cellLocation}, ${prisoner.prisonName}`
}

export const getIdsToFlag = ({
  notificationType,
  returnedIdType,
  notifications,
}: {
  notificationType: NotificationType
  returnedIdType: Extract<VisitNotificationEventAttributeNames, 'VISITOR_RESTRICTION_ID' | 'VISITOR_ID' | 'ALERT_UUID'>
  notifications: VisitBookingDetails['notifications']
}): string[] => {
  const flaggedIds = new Set<string>() // only want unique IDs
  notifications
    .filter(notification => notification.type === notificationType)
    .forEach(notification => {
      const matchedNotifications = notification.additionalData.find(data => data.attributeName === returnedIdType)
      flaggedIds.add(matchedNotifications?.attributeValue)
    })
  return Array.from(flaggedIds)
}
