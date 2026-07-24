import { isFuture, isToday } from 'date-fns'
import config from '../../../config'
import type { VisitBookingDetails } from '../../../data/orchestrationApiTypes'

const A_DAY_IN_MS = 24 * 60 * 60 * 1000
const CANCELLATION_LIMIT_MS = config.visit.cancellationLimitDays * A_DAY_IN_MS

export type AvailableVisitActions = {
  update: boolean
  cancel: boolean
  clearNotifications: boolean
  print: boolean
  processRequest: boolean
}

export default ({
  visitStatus,
  visitSubStatus,
  startTimestamp,
  notifications,
}: {
  visitStatus: VisitBookingDetails['visitStatus']
  visitSubStatus: VisitBookingDetails['visitSubStatus']
  startTimestamp: VisitBookingDetails['startTimestamp']
  notifications: VisitBookingDetails['notifications']
}): AvailableVisitActions => {
  const availableVisitActions = {
    update: false,
    cancel: false,
    clearNotifications: false,
    print: false,
    processRequest: false,
  }

  if (visitSubStatus === 'REQUESTED') {
    availableVisitActions.processRequest = true
    return availableVisitActions
  }

  if (visitStatus !== 'BOOKED') {
    return availableVisitActions
  }

  const visitStartTime = new Date(startTimestamp)

  // update
  const hasUpdateBlockingNotifications = notifications.some(
    notification => notification.type === 'PRISONER_RECEIVED_EVENT' || notification.type === 'PRISONER_RELEASED_EVENT',
  )

  if (!hasUpdateBlockingNotifications && isFuture(visitStartTime)) {
    availableVisitActions.update = true
  }

  // print
  if (!notifications.length && (isToday(visitStartTime) || isFuture(visitStartTime))) {
    availableVisitActions.print = true
  }

  // cancel
  const latestCancellationTime = new Date(visitStartTime.getTime() + CANCELLATION_LIMIT_MS)

  if (isFuture(latestCancellationTime)) {
    availableVisitActions.cancel = true
  }

  // clear notifications ('do not change')
  const hasBlockedDateOrSessionNotification = notifications.some(
    notification =>
      notification.type === 'PRISON_VISITS_BLOCKED_FOR_DATE' || notification.type === 'SESSION_VISITS_BLOCKED_FOR_DATE',
  )

  const hasUnapprovedVisitorNotification = notifications.some(
    notification => notification.type === 'VISITOR_UNAPPROVED_EVENT',
  )

  if (!hasBlockedDateOrSessionNotification && !hasUnapprovedVisitorNotification && notifications.length > 0) {
    availableVisitActions.clearNotifications = true
  }

  return availableVisitActions
}
