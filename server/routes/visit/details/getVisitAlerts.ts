import type { MoJAlert } from '../../../@types/bapv'
import { notificationTypeAlerts } from '../../../constants/notifications'
import { visitCancellationAlerts } from '../../../constants/visitCancellation'
import { visitRequestRejectionAlerts } from '../../../constants/visitRequestRejection'
import type { VisitBookingDetails, VisitRequestRejectionReason } from '../../../data/orchestrationApiTypes'
import { getIdsToFlag } from '../visitUtils'

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
    const rejectionEvent = events.find(event => event.type === 'REQUESTED_VISIT_REJECTED')
    const rejectionReason = rejectionEvent?.text

    const title =
      typeof rejectionReason === 'string' && rejectionReason in visitRequestRejectionAlerts
        ? visitRequestRejectionAlerts[rejectionReason as VisitRequestRejectionReason]
        : visitRequestRejectionAlerts.default

    return {
      variant: 'information',
      title,
      showTitleAsHeading: true,
      text: rejectionEvent?.actionedByFullName
        ? `This visit request was rejected by ${rejectionEvent.actionedByFullName}`
        : 'This visit request was rejected',
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
    if (
      notification.type === 'VISITOR_RESTRICTION' ||
      notification.type === 'VISITOR_UNAPPROVED_EVENT' ||
      notification.type === 'PRISONER_ALERT_UPDATED_EVENT' ||
      notification.type === 'PRISONER_ALERT_CREATED_EVENT'
    ) {
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
    const alertUpdatedIds = getIdsToFlag({
      notificationType: 'PRISONER_ALERT_UPDATED_EVENT',
      returnedIdType: 'ALERT_UUID',
      notifications: linkedNotifications,
    })
    const alertCreatedIds = getIdsToFlag({
      notificationType: 'PRISONER_ALERT_CREATED_EVENT',
      returnedIdType: 'ALERT_UUID',
      notifications: linkedNotifications,
    })

    let notificationItems = visitorRestrictionIds
      .map(id => `<li><a href="#visitor-restriction-${id}">A restriction has been added or updated</a></li>`)
      .join('')

    notificationItems += unapprovedVisitorIds
      .map(id => `<li><a href="#visitor-${id}">Visitor has been unapproved</a></li>`)
      .join('')

    notificationItems += alertUpdatedIds
      .map(id => `<li><a href="#prisoner-alert-${id}">An alert has been updated</a></li>`)
      .join('')

    notificationItems += alertCreatedIds
      .map(id => `<li><a href="#prisoner-alert-${id}">An alert has been added</a></li>`)
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

export default (visitDetails: VisitBookingDetails): MoJAlert[] => {
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
