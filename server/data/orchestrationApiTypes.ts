import { components } from '../@types/orchestration-api'

export type VisitorSupport = components['schemas']['VisitorSupportDto']

export type PageVisitDto = components['schemas']['PageVisitDto']
export type Visit = components['schemas']['VisitDto']
export type VisitHistoryDetails = components['schemas']['VisitHistoryDetailsDto']
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

export type PrisonerProfile = components['schemas']['PrisonerProfileDto']
export type VisitSummary = components['schemas']['VisitSummaryDto']

export type EventAuditType = components['schemas']['EventAuditOrchestrationDto']['type']

export type NotificationCount = components['schemas']['NotificationCountDto']
export type NotificationType = components['schemas']['OrchestrationNotificationGroupDto']['type']
export type NotificationGroup = components['schemas']['OrchestrationNotificationGroupDto']
export type NotificationVisitInfo = components['schemas']['OrchestrationPrisonerVisitsNotificationDto']

export type PrisonDto = components['schemas']['PrisonDto']

export type ExcludeDateDto = components['schemas']['ExcludeDateDto']

export type IsExcludeDateDto = components['schemas']['IsExcludeDateDto']

export type ApplicationValidationErrorResponse = components['schemas']['ApplicationValidationErrorResponse']
