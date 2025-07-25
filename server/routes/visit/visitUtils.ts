import { MoJAlert } from '../../@types/bapv'
import config from '../../config'
import { notificationTypeAlerts } from '../../constants/notifications'
import { visitCancellationAlerts } from '../../constants/visitCancellation'
import { EventAudit, VisitBookingDetails } from '../../data/orchestrationApiTypes'

const A_DAY_IN_MS = 24 * 60 * 60 * 1000
const CANCELLATION_LIMIT_MS = config.visit.cancellationLimitDays * A_DAY_IN_MS

export const getPrisonerLocation = (prisoner: VisitBookingDetails['prisoner']) => {
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
  visitSubStatus,
  startTimestamp,
  notifications,
}: {
  visitStatus: VisitBookingDetails['visitStatus']
  visitSubStatus: VisitBookingDetails['visitSubStatus']
  startTimestamp: VisitBookingDetails['startTimestamp']
  notifications: VisitBookingDetails['notifications']
}): { update: boolean; cancel: boolean; clearNotifications: boolean; processRequest: boolean } => {
  const availableVisitActions = {
    update: false,
    cancel: false,
    clearNotifications: false,
    processRequest: false,
  }

  if (visitSubStatus === 'REQUESTED') {
    availableVisitActions.processRequest = true
    return availableVisitActions
  }

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

const getVisitCancelledAlert = ({
  visitStatus,
  visitSubStatus,
  outcomeStatus,
}: {
  visitStatus: VisitBookingDetails['visitStatus']
  visitSubStatus: VisitBookingDetails['visitSubStatus']
  outcomeStatus: VisitBookingDetails['outcomeStatus']
}): MoJAlert | undefined => {
  if (visitStatus !== 'CANCELLED' || visitSubStatus !== 'CANCELLED') {
    return undefined
  }

  return {
    variant: 'information',
    title: 'Visit cancelled',
    showTitleAsHeading: true,
    text: visitCancellationAlerts[outcomeStatus] ?? visitCancellationAlerts.default,
  }
}

const getVisitRequestAlert = ({
  visitStatus,
  visitSubStatus,
  events,
}: {
  visitStatus: VisitBookingDetails['visitStatus']
  visitSubStatus: VisitBookingDetails['visitSubStatus']
  events: VisitBookingDetails['events']
}): MoJAlert | undefined => {
  if (visitSubStatus === 'REQUESTED') {
    return {
      variant: 'warning',
      title: 'This request needs to be reviewed',
      showTitleAsHeading: true,
      text: 'Check alerts and restrictions.',
    }
  }

  if (visitStatus === 'CANCELLED' && visitSubStatus === 'REJECTED') {
    const username = events.find(event => event.type === 'REQUESTED_VISIT_REJECTED')?.actionedByFullName

    return {
      variant: 'information',
      title: 'Request rejected',
      showTitleAsHeading: true,
      text: `This visit request was rejected by ${username}`,
    }
  }

  return undefined
}

const getVisitNotificationsAlerts = (notifications: VisitBookingDetails['notifications']): MoJAlert[] => {
  // split notifications into those that should be a single alert and those to be grouped into one alert
  const singleNotifications: VisitBookingDetails['notifications'] = []
  const groupedNotifications: VisitBookingDetails['notifications'] = []
  notifications.forEach(notification => {
    if (notification.type === 'VISITOR_RESTRICTION') {
      groupedNotifications.push(notification)
    } else {
      singleNotifications.push(notification)
    }
  })

  if (!singleNotifications.length && !groupedNotifications.length) {
    return []
  }

  const alerts = []

  singleNotifications.forEach(notification => {
    if (notificationTypeAlerts[notification.type]) {
      alerts.push(notificationTypeAlerts[notification.type])
    }
  })

  if (groupedNotifications.length) {
    const visitorRestrictionIds = getVisitorRestrictionIdsToFlag(groupedNotifications)

    const restrictionListItems = visitorRestrictionIds
      .map(id => `<li><a href="#visitor-restriction-${id}">A restriction has been added or updated</a></li>`)
      .join('')

    alerts.push({
      variant: 'warning',
      title: 'This visit needs review',
      showTitleAsHeading: true,
      html: `<ul class="govuk-list">${restrictionListItems}</ul>`,
      classes: 'notifications-summary-alert',
    } as MoJAlert)
  }

  return alerts
}

export const getVisitAlerts = (visitDetails: VisitBookingDetails): MoJAlert[] => {
  const { visitStatus, visitSubStatus, outcomeStatus, events, notifications } = visitDetails

  const visitCancelledAlert = getVisitCancelledAlert({
    visitStatus,
    visitSubStatus,
    outcomeStatus,
  })
  const visitRequestAlert = getVisitRequestAlert({
    visitStatus,
    visitSubStatus,
    events,
  })
  const visitNotificationsAlerts = getVisitNotificationsAlerts(notifications)

  return [
    ...(visitCancelledAlert ? [visitCancelledAlert] : []),
    ...(visitRequestAlert ? [visitRequestAlert] : []),
    ...visitNotificationsAlerts,
  ]
}

export const getVisitorRestrictionIdsToFlag = (notifications: VisitBookingDetails['notifications']): number[] => {
  const restrictionIds = new Set<number>() // only want unique IDs
  notifications
    .filter(notification => notification.type === 'VISITOR_RESTRICTION')
    .forEach(notification => {
      const restrictionData = notification.additionalData.find(data => data.attributeName === 'VISITOR_RESTRICTION_ID')
      restrictionIds.add(parseInt(restrictionData?.attributeValue, 10))
    })
  return Array.from(restrictionIds)
}

export const isPublicBooking = (events: EventAudit[]): boolean => {
  const visitBookedEvent = events.find(event => event.type === 'BOOKED_VISIT')
  return visitBookedEvent?.userType === 'PUBLIC'
}
