import { MoJAlert } from '../../@types/bapv'
import config from '../../config'
import { notificationTypeAlerts } from '../../constants/notifications'
import { visitCancellationAlerts } from '../../constants/visitCancellation'
import { EventAudit, VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'

const A_DAY_IN_MS = 24 * 60 * 60 * 1000
const CANCELLATION_LIMIT_MS = config.visit.cancellationLimitDays * A_DAY_IN_MS

export const getPrisonerLocation = (prisoner: VisitBookingDetailsDto['prisoner']) => {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }

  if (prisoner.prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${prisoner.cellLocation}, ${prisoner.prisonName}`
}

export type AvailableVisitActions = ReturnType<typeof getAvailableVisitActions>

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

  // update
  const hasUpdateBlockingNotifications = notifications.some(
    notification => notification.type === 'PRISONER_RECEIVED_EVENT' || notification.type === 'PRISONER_RELEASED_EVENT',
  )

  if (!hasUpdateBlockingNotifications && now < visitStartTime) {
    availableVisitActions.update = true
  }

  // cancel
  const latestCancellationTime = new Date(visitStartTime.getTime() + CANCELLATION_LIMIT_MS)

  if (now < latestCancellationTime) {
    availableVisitActions.cancel = true
  }

  // do not change
  const hasBlockedDateNotification = notifications.some(
    notification => notification.type === 'PRISON_VISITS_BLOCKED_FOR_DATE',
  )

  if (!hasBlockedDateNotification && notifications.length > 0) {
    availableVisitActions.clearNotifications = true
  }

  return availableVisitActions
}

export const getVisitCancelledAlert = ({
  visitStatus,
  outcomeStatus,
}: {
  visitStatus: VisitBookingDetailsDto['visitStatus']
  outcomeStatus: VisitBookingDetailsDto['outcomeStatus']
}): MoJAlert | undefined => {
  if (visitStatus !== 'CANCELLED') {
    return undefined
  }

  return {
    variant: 'information',
    title: 'Visit cancelled',
    showTitleAsHeading: true,
    text: visitCancellationAlerts[outcomeStatus] ?? visitCancellationAlerts.default,
  }
}

export const getVisitNotificationsAlerts = (notifications: VisitBookingDetailsDto['notifications']): MoJAlert[] => {
  const alerts = <MoJAlert[]>[]

  notifications.forEach(notification => {
    if (notificationTypeAlerts[notification.type]) {
      alerts.push(notificationTypeAlerts[notification.type])
    }
  })

  return alerts
}

export const isPublicBooking = (events: EventAudit[]): boolean => {
  const visitBookedEvent = events.find(event => event.type === 'BOOKED_VISIT')
  return visitBookedEvent?.userType === 'PUBLIC'
}
