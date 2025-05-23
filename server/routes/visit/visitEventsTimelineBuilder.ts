import eventAuditTypes from '../../constants/eventAudit'
import { notificationTypes } from '../../constants/notifications'
import { requestMethodDescriptions } from '../../constants/requestMethods'
import { EventAudit, VisitBookingDetails } from '../../data/orchestrationApiTypes'

export type MojTimelineItem = {
  label: { text: string }
  text: string
  datetime: {
    timestamp: string
    type: 'datetime'
  }
  byline?: { text: string }
  attributes: { 'data-test': string }
}

export default ({
  events,
  visitNotes,
}: {
  events: EventAudit[]
  visitNotes: VisitBookingDetails['visitNotes']
}): MojTimelineItem[] => {
  return events
    .filter(event => event.type in eventAuditTypes)
    .reverse()
    .map((event, index) => {
      // Initial timeline item
      const timelineItem: MojTimelineItem = {
        label: { text: eventAuditTypes[event.type] ?? '' },
        text: '',
        datetime: { timestamp: event.createTimestamp, type: 'datetime' },
        attributes: { 'data-test': `timeline-entry-${index}` },
      }

      // Add item text for event types
      switch (event.type) {
        case 'BOOKED_VISIT':
        case 'UPDATED_VISIT':
        case 'MIGRATED_VISIT':
          timelineItem.text = isPublicBooking(event)
            ? 'Method: GOV.UK booking'
            : (requestMethodDescriptions[event.applicationMethodType] ?? '')
          break

        case 'IGNORE_VISIT_NOTIFICATIONS_EVENT':
          timelineItem.text = `Reason: ${event.text}`
          break

        case 'CANCELLED_VISIT':
          timelineItem.text = isPublicBooking(event)
            ? 'Method: GOV.UK cancellation'
            : (getCancellationReason(visitNotes) ?? requestMethodDescriptions[event.applicationMethodType])
          break

        default:
          timelineItem.text = isANotificationType(event.type) ? `Reason: ${notificationTypes[event.type]}` : ''
      }

      // Byline optional: set if user is known
      if (event.actionedByFullName && event.actionedByFullName !== 'NOT_KNOWN') {
        timelineItem.byline = {
          text: event.actionedByFullName === 'NOT_KNOWN_NOMIS' ? 'NOMIS' : event.actionedByFullName,
        }
      }

      return timelineItem
    })
}

// Type guard: needed because event types and notifications only have some overlap
const isANotificationType = (type: string): type is keyof typeof notificationTypes => type in notificationTypes

// Identify public bookings so text can be overridden
const isPublicBooking = (event: EventAudit): boolean =>
  event.userType === 'PUBLIC' && event.applicationMethodType === 'WEBSITE'

// Get user-entered cancellation reason, if set
const getCancellationReason = (visitNotes: VisitBookingDetails['visitNotes']): string | undefined => {
  const reason = visitNotes.find(note => note.type === 'VISIT_OUTCOMES')?.text
  return reason ? `Reason: ${reason}` : undefined
}
