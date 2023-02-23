import { components } from '../@types/visit-scheduler-api'

export type SupportType = components['schemas']['SupportTypeDto']

export type VisitorSupport = components['schemas']['VisitorSupportDto']

export type PageVisitDto = components['schemas']['PageVisitDto']
export type Visit = components['schemas']['VisitDto']
export type Visitor = components['schemas']['VisitorDto']

export type ReserveVisitSlotDto = components['schemas']['ReserveVisitSlotDto']
export type ChangeVisitSlotRequestDto = components['schemas']['ChangeVisitSlotRequestDto']

export type OutcomeDto = components['schemas']['OutcomeDto']

export type SessionCapacity = components['schemas']['SessionCapacityDto']
// export type SessionSchedule = components['schemas']['SessionScheduleDto']
export type SessionSchedule = {
  capacity: {
    closed: number
    open: number
  }
  endTime: string
  prisonerLocationGroupNames: string[]
  sessionTemplateEndDate?: string
  sessionTemplateFrequency: 'BI_WEEKLY' | 'WEEKLY' | 'ONE_OFF'
  sessionTemplateReference: string
  startTime: string
}

export type VisitSession = components['schemas']['VisitSessionDto']
