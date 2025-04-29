import { NotificationType, VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'

// TODO move these to config?
const A_DAY_IN_MS = 24 * 60 * 60 * 1000
const CANCELLATION_LIMIT_DAYS = 28
const NO_UPDATE_NOTIFICATION_TYPES: NotificationType[] = ['PRISONER_RECEIVED_EVENT', 'PRISONER_RELEASED_EVENT']

export const getPrisonerLocation = (prisoner: VisitBookingDetailsDto['prisoner']) => {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }

  if (prisoner.prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${prisoner.cellLocation}, ${prisoner.prisonName}`
}

export const getAvailableVisitActions = ({
  visitStatus,
  startTimestamp,
  notifications,
}: {
  visitStatus: VisitBookingDetailsDto['visitStatus']
  startTimestamp: VisitBookingDetailsDto['startTimestamp']
  notifications: VisitBookingDetailsDto['notifications']
}): { update: boolean; cancel: boolean; clearNotifications: boolean } => {
  const availableVisitActions = { update: false, cancel: false, clearNotifications: false }

  if (visitStatus !== 'BOOKED') {
    return availableVisitActions
  }

  const now = new Date()
  const visitStartTime = new Date(startTimestamp)

  const noUpdate = notifications.some(notification => NO_UPDATE_NOTIFICATION_TYPES.includes(notification.type))

  if (now < visitStartTime && !noUpdate) {
    availableVisitActions.update = true
  }

  const latestCancellationTime = new Date(visitStartTime.getTime() + A_DAY_IN_MS * CANCELLATION_LIMIT_DAYS)
  if (now < latestCancellationTime) {
    availableVisitActions.cancel = true
  }

  const clearableNotifications = notifications.filter(
    notification => notification.type !== 'PRISON_VISITS_BLOCKED_FOR_DATE',
  )
  if (clearableNotifications.length > 0) {
    availableVisitActions.clearNotifications = true
  }

  return availableVisitActions
}
