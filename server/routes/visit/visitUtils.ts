import { isFuture, isPast } from 'date-fns'
import { GOVUKInsetText, MoJAlert } from '../../@types/bapv'
import config from '../../config'
import { notificationTypeAlerts } from '../../constants/notifications'
import { visitCancellationAlerts } from '../../constants/visitCancellation'
import {
  EventAudit,
  NotificationType,
  VisitBookingDetails,
  VisitNotificationEventAttributeNames,
} from '../../data/orchestrationApiTypes'

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

  const visitStartTime = new Date(startTimestamp)

  // update
  const hasUpdateBlockingNotifications = notifications.some(
    notification => notification.type === 'PRISONER_RECEIVED_EVENT' || notification.type === 'PRISONER_RELEASED_EVENT',
  )

  if (!hasUpdateBlockingNotifications && isFuture(new Date(startTimestamp))) {
    availableVisitActions.update = true
  }

  // cancel
  const latestCancellationTime = new Date(visitStartTime.getTime() + CANCELLATION_LIMIT_MS)

  if (isFuture(latestCancellationTime)) {
    availableVisitActions.cancel = true
  }

  // do not change
  const hasBlockedDateNotification = notifications.some(
    notification => notification.type === 'PRISON_VISITS_BLOCKED_FOR_DATE',
  )

  const hasUnapprovedVisitorNotification = notifications.some(
    notification => notification.type === 'VISITOR_UNAPPROVED_EVENT',
  )

  if (!hasBlockedDateNotification && !hasUnapprovedVisitorNotification && notifications.length > 0) {
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

  if (visitStatus === 'CANCELLED' && visitSubStatus === 'WITHDRAWN') {
    return {
      variant: 'information',
      title: 'Request withdrawn',
      showTitleAsHeading: true,
      text: `This visit request was withdrawn by the booker`,
    }
  }

  return undefined
}

const getVisitNotificationsAlerts = (notifications: VisitBookingDetails['notifications']): MoJAlert[] => {
  // simpleNotifications are simple descriptive notifications
  // linkedNotifications are notifications with anchors to restrictions/visitors on the page
  const simpleNotifications: VisitBookingDetails['notifications'] = []
  const linkedNotifications: VisitBookingDetails['notifications'] = []
  notifications.forEach(notification => {
    if (notification.type === 'VISITOR_RESTRICTION' || notification.type === 'VISITOR_UNAPPROVED_EVENT') {
      linkedNotifications.push(notification)
    } else {
      simpleNotifications.push(notification)
    }
  })

  if (!simpleNotifications.length && !linkedNotifications.length) {
    return []
  }

  const alerts = []

  simpleNotifications.forEach(notification => {
    if (notificationTypeAlerts[notification.type]) {
      alerts.push(notificationTypeAlerts[notification.type])
    }
  })

  if (linkedNotifications.length) {
    const visitorRestrictionIds = getIdsToFlag({
      notificationType: 'VISITOR_RESTRICTION',
      returnedIdType: 'VISITOR_RESTRICTION_ID',
      notifications: linkedNotifications,
    })
    const unapprovedVisitorIds = getIdsToFlag({
      notificationType: 'VISITOR_UNAPPROVED_EVENT',
      returnedIdType: 'VISITOR_ID',
      notifications: linkedNotifications,
    })

    let notificationItems = visitorRestrictionIds
      .map(id => `<li><a href="#visitor-restriction-${id}">A restriction has been added or updated</a></li>`)
      .join('')

    notificationItems += unapprovedVisitorIds
      .map(id => `<li><a href="#visitor-${id}">Visitor has been unapproved</a></li>`)
      .join('')

    alerts.push({
      variant: 'warning',
      title: 'This visit needs review',
      showTitleAsHeading: true,
      html: `<ul class="govuk-list">${notificationItems}</ul>`,
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

export const getIdsToFlag = ({
  notificationType,
  returnedIdType,
  notifications,
}: {
  notificationType: NotificationType
  returnedIdType: Extract<VisitNotificationEventAttributeNames, 'VISITOR_RESTRICTION_ID' | 'VISITOR_ID'>
  notifications: VisitBookingDetails['notifications']
}): number[] => {
  const flaggedIds = new Set<number>() // only want unique IDs
  notifications
    .filter(notification => notification.type === notificationType)
    .forEach(notification => {
      const matchedNotifications = notification.additionalData.find(data => data.attributeName === returnedIdType)
      flaggedIds.add(parseInt(matchedNotifications?.attributeValue, 10))
    })
  return Array.from(flaggedIds)
}

export const isPublicBooking = (events: EventAudit[]): boolean => {
  const visitBookedEvent = events.find(event => event.type === 'BOOKED_VISIT')
  return visitBookedEvent?.userType === 'PUBLIC'
}

export const getHideAlertsInset = ({
  startTimestamp,
  visitPrisonId,
  prisonerPrisonId,
  inOutStatus,
}: {
  startTimestamp: VisitBookingDetails['startTimestamp']
  visitPrisonId: string
  prisonerPrisonId: string
  inOutStatus: VisitBookingDetails['prisoner']['inOutStatus']
}): { prisoner: GOVUKInsetText; visitor: GOVUKInsetText } | null => {
  const visitStartTime = new Date(startTimestamp)

  if (isPast(visitStartTime)) {
    return {
      prisoner: {
        html: `Alerts and restrictions are not shown for past visits.<br>You can view alerts and restrictions for past visits in the <a href="${config.dpsContacts}">contacts service</a>.`,
        attributes: { 'data-test': 'prisoner-inset' },
        classes: 'govuk-!-margin-bottom-1',
      },
      visitor: {
        html: `Visitor restrictions are not shown for past visits.<br>You can view alerts and restrictions for past visits in the <a href="${config.dpsContacts}">contacts service</a>.`,
        attributes: { 'data-test': 'visitor-inset' },
      },
    }
  }

  if (prisonerPrisonId === 'OUT') {
    return {
      prisoner: {
        text: 'Alerts and restrictions are not shown for released prisoners.',
        attributes: { 'data-test': 'prisoner-inset' },
        classes: 'govuk-!-margin-bottom-1',
      },
      visitor: {
        html: 'Visitor restrictions are not shown for released prisoners.',
        attributes: { 'data-test': 'visitor-inset' },
      },
    }
  }

  if (prisonerPrisonId !== visitPrisonId && inOutStatus !== 'TRN') {
    return {
      prisoner: {
        text: 'Alerts and restrictions are not shown for transferred prisoners.',
        attributes: { 'data-test': 'prisoner-inset' },
        classes: 'govuk-!-margin-bottom-1',
      },
      visitor: {
        html: 'Visitor restrictions are not shown for transferred prisoners.',
        attributes: { 'data-test': 'visitor-inset' },
      },
    }
  }
  return null
}
