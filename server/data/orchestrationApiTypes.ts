import { components } from '../@types/orchestration-api'

export type SupportType = components['schemas']['SupportTypeDto']

export type VisitorSupport = components['schemas']['VisitorSupportDto']

// Temp fixes for enums incorrectly defined as strings in orchestration API - VB-2081
export type PageVisitDto = components['schemas']['PageVisitDto']
export type Visit = components['schemas']['VisitDto']
export type VisitHistoryDetails = components['schemas']['VisitHistoryDetailsDto']

export type Visitor = components['schemas']['VisitorDto']

export type ReserveVisitSlotDto = components['schemas']['ReserveVisitSlotDto']
export type ChangeVisitSlotRequestDto = components['schemas']['ChangeVisitSlotRequestDto']

export type OutcomeDto = components['schemas']['OutcomeDto']

export type SessionCapacity = components['schemas']['SessionCapacityDto']
export type SessionSchedule = components['schemas']['SessionScheduleDto']

export type VisitSession = components['schemas']['VisitSessionDto']

export type Alert = components['schemas']['AlertDto']

export type PrisonerProfile = components['schemas']['PrisonerProfileDto']
