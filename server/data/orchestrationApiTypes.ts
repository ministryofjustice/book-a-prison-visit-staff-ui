import { components } from '../@types/orchestration-api'

export type SupportType = components['schemas']['SupportTypeDto']

export type VisitorSupport = components['schemas']['VisitorSupportDto']

export type PageVisitDto = components['schemas']['PageVisitDto']
export type Visit = components['schemas']['VisitDto']
export type VisitHistoryDetails = components['schemas']['VisitHistoryDetailsDto']

export type Visitor = components['schemas']['VisitorDto']

export type ReserveVisitSlotDto = components['schemas']['ReserveVisitSlotDto']
export type ChangeVisitSlotRequestDto = components['schemas']['ChangeVisitSlotRequestDto']

export type OutcomeDto = components['schemas']['OutcomeDto']
export type CancelVisitOrchestrationDto = components['schemas']['CancelVisitOrchestrationDto']

export type ApplicationMethodType = components['schemas']['BookingOrchestrationRequestDto']['applicationMethodType']
export type BookingOrchestrationRequestDto = components['schemas']['BookingOrchestrationRequestDto']

export type SessionCapacity = components['schemas']['SessionCapacityDto']
export type SessionSchedule = components['schemas']['SessionScheduleDto']

export type VisitSession = components['schemas']['VisitSessionDto']

export type Alert = components['schemas']['AlertDto']

export type PrisonerProfile = components['schemas']['PrisonerProfileDto']
export type VisitSummary = components['schemas']['VisitSummaryDto']

export type EventAuditType = components['schemas']['EventAuditDto']['type']

export type NotificationCount = components['schemas']['NotificationCountDto']
