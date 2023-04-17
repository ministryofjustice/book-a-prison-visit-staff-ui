import { components } from '../@types/orchestration-api'

export type SupportType = components['schemas']['SupportTypeDto']

export type VisitorSupport = components['schemas']['VisitorSupportDto']

// Temp fixes for enums incorrectly defined as strings in orchestration API - VB-2081
// export type PageVisitDto = components['schemas']['PageVisitDto']
// export type Visit = components['schemas']['VisitDto']
// export type VisitHistoryDetails = components['schemas']['VisitHistoryDetailsDto']
export type Visit = Omit<components['schemas']['VisitDto'], 'visitRestriction' | 'visitStatus' | 'visitType'> & {
  visitRestriction: 'OPEN' | 'CLOSED' | 'UNKNOWN'
  visitStatus: 'RESERVED' | 'CHANGING' | 'BOOKED' | 'CANCELLED'
  visitType: 'SOCIAL'
}
export type PageVisitDto = Omit<components['schemas']['PageVisitDto'], 'content'> & { content: Visit[] }
export type VisitHistoryDetails = Omit<components['schemas']['VisitHistoryDetailsDto'], 'visit'> & { visit: Visit }

export type Visitor = components['schemas']['VisitorDto']

export type ReserveVisitSlotDto = components['schemas']['ReserveVisitSlotDto']
export type ChangeVisitSlotRequestDto = components['schemas']['ChangeVisitSlotRequestDto']

export type OutcomeDto = components['schemas']['OutcomeDto']

export type SessionCapacity = components['schemas']['SessionCapacityDto']
export type SessionSchedule = components['schemas']['SessionScheduleDto']

export type VisitSession = components['schemas']['VisitSessionDto']

export type Alert = components['schemas']['AlertDto']

export type PrisonerProfile = Omit<components['schemas']['PrisonerProfileDto'], 'visits'> & {
  visits: Visit[]
}

