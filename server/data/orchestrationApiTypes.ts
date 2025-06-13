import { components } from '../@types/orchestration-api'

// Visitor restrictions can be 2 types (local/global). Raw API values are processed in the data layer
// and replaced with the VISITOR_RESTRICTION value for use within the application
type VISITOR_RESTRICTION = 'VISITOR_RESTRICTION'

export type VisitorSupport = components['schemas']['VisitorSupportDto']

export type PageVisitDto = components['schemas']['PageVisitDto']
export type Visit = components['schemas']['VisitDto']
export type VisitBookingDetailsRaw = components['schemas']['VisitBookingDetailsDto']
type VisitNotificationDto = components['schemas']['VisitNotificationDto']
// Replace raw event and notifications 'type' ones that have VISITOR_RESTRICTION
export type VisitBookingDetails = Omit<VisitBookingDetailsRaw, 'events' | 'notifications'> & {
  events: EventAudit[]
  notifications: (Omit<VisitNotificationDto, 'type'> & { type: NotificationType })[]
}
export type VisitRestriction = Visit['visitRestriction']
export type VisitPreview = components['schemas']['VisitPreviewDto']

export type Visitor = components['schemas']['VisitorDto']

export type ApplicationDto = components['schemas']['ApplicationDto']
export type ChangeApplicationDto = components['schemas']['ChangeApplicationDto']
export type CreateApplicationDto = components['schemas']['CreateApplicationDto']

export type OutcomeDto = components['schemas']['OutcomeDto']
export type CancelVisitOrchestrationDto = components['schemas']['CancelVisitOrchestrationDto']
export type IgnoreVisitNotificationsDto = components['schemas']['IgnoreVisitNotificationsDto']

export type ApplicationMethodType = components['schemas']['BookingOrchestrationRequestDto']['applicationMethodType']
export type BookingOrchestrationRequestDto = components['schemas']['BookingOrchestrationRequestDto']

export type SessionCapacity = components['schemas']['SessionCapacityDto']
export type SessionSchedule = components['schemas']['SessionScheduleDto']

export type VisitSession = components['schemas']['VisitSessionDto']

export type Alert = components['schemas']['AlertDto']
export type OffenderRestriction = components['schemas']['OffenderRestrictionDto']

export type PrisonerProfile = components['schemas']['PrisonerProfileDto']
export type VisitSummary = components['schemas']['VisitSummaryDto']

// Raw local/global visitor restrictions mapped to VISITOR_RESTRICTION as described above
export type EventAuditRaw = components['schemas']['EventAuditOrchestrationDto']
export type EventAuditTypeRaw = EventAuditRaw['type']
export type EventAuditType =
  | Exclude<EventAuditTypeRaw, 'PERSON_RESTRICTION_UPSERTED_EVENT' | 'VISITOR_RESTRICTION_UPSERTED_EVENT'>
  | VISITOR_RESTRICTION
export type EventAudit = Omit<EventAuditRaw, 'type'> & { type: EventAuditType }

// Raw local/global visitor restrictions mapped to VISITOR_RESTRICTION as described above
export type NotificationCount = components['schemas']['NotificationCountDto']
export type VisitNotificationEventRaw = components['schemas']['VisitNotificationEventDto']
export type NotificationTypeRaw = VisitNotificationEventRaw['type']
export type NotificationType =
  | Exclude<NotificationTypeRaw, 'PERSON_RESTRICTION_UPSERTED_EVENT' | 'VISITOR_RESTRICTION_UPSERTED_EVENT'>
  | VISITOR_RESTRICTION
export type VisitNotificationEvent = Omit<VisitNotificationEventRaw, 'type'> & { type: NotificationType }
export type VisitNotificationsRaw = components['schemas']['OrchestrationVisitNotificationsDto']
export type VisitNotifications = Omit<VisitNotificationsRaw, 'notifications'> & {
  notifications: (Omit<VisitNotificationEventRaw, 'type'> & { type: NotificationType })[]
}

export type PrisonDto = components['schemas']['PrisonDto']

export type ExcludeDateDto = components['schemas']['ExcludeDateDto']

export type IsExcludeDateDto = components['schemas']['IsExcludeDateDto']

export type ApplicationValidationErrorResponse = components['schemas']['ApplicationValidationErrorResponse']
