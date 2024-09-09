import { OffenderRestriction } from '../data/prisonApiTypes'
import { PrisonName } from '../data/prisonRegisterApiTypes'
import {
  ApplicationMethodType,
  NotificationType,
  PrisonerProfile,
  Visit,
  VisitorSupport,
  VisitSession,
  VisitSummary,
} from '../data/orchestrationApiTypes'

export type PrisonerDetailsItem = {
  html?: string
  text?: string
  classes?: string
  attributes?: {
    'data-test': string
  }
}

export type VisitorListItem = {
  personId: number
  name: string
  dateOfBirth?: string
  adult: boolean
  relationshipDescription: string
  address?: string
  restrictions: Restriction[]
  banned: boolean
}

export type PrisonerProfilePage = {
  activeAlerts: Alert[]
  activeAlertCount: number
  flaggedAlerts: Alert[]
  prisonerDetails: {
    prisonerId: string
    name: string
    dateOfBirth: string
    cellLocation: string
    prisonName: string
    convictedStatus: PrisonerProfile['convictedStatus']
    category: string
    incentiveLevel: string
    visitBalances: PrisonerProfile['visitBalances'] & {
      nextIepAdjustDate?: string
      nextPrivIepAdjustDate?: string
    }
  }
  visitsByMonth: Map<string, { upcomingCount: number; pastCount: number; visits: VisitSummary[] }>
}

// Visit slots, for representing data derived from VisitSessions
export type VisitSlot = {
  id: string
  sessionTemplateReference: string
  prisonId: string
  startTimestamp: string
  endTimestamp: string
  availableTables: number
  capacity: number
  visitRoom: string
  visitRestriction: 'OPEN' | 'CLOSED'
  sessionConflicts?: VisitSession['sessionConflicts']
}

export type PrisonerEvent = {
  startTimestamp: string
  endTimestamp: string
  description: string
}

export type VisitSlotsForDay = {
  date: string
  slots: {
    morning: VisitSlot[]
    afternoon: VisitSlot[]
  }
  prisonerEvents: {
    morning: PrisonerEvent[]
    afternoon: PrisonerEvent[]
  }
}

export type VisitSlotList = {
  [key: string]: VisitSlotsForDay[] // keyed on month value, e.g. 'February 2022'
}

export type FormError = {
  value: string
  msg: string
  path: string
  type: string
  location: string
}

export type VisitSessionData = {
  prisoner: {
    name: string
    offenderNo: string
    dateOfBirth: string
    location: string
    restrictions?: OffenderRestriction[]
  }
  visitSlot?: VisitSlot
  originalVisitSlot?: VisitSlot
  visitRestriction?: 'OPEN' | 'CLOSED'
  visitors?: VisitorListItem[]
  visitorSupport?: VisitorSupport
  mainContact?: {
    contact?: VisitorListItem
    phoneNumber?: string
    contactName?: string
  }
  applicationReference?: string
  visitReference?: string // only set during an update journey; during initial booking it's unknown
  visitStatus?: Visit['visitStatus']
  requestMethod?: ApplicationMethodType
  daysUntilBanExpiry?: number
  overrideBookingWindow?: boolean
}

export type VisitInformation = {
  reference: string
  prisonNumber: string
  prisonerName: string
  mainContact: string
  visitDate: string
  visitTime: string
  visitStatus: Visit['visitStatus']
}

export type VisitsPageSideNavItem = {
  reference: string
  times: string
  capacity?: number // optional to cater for 'unknown' visits with no session template
  queryParams: string
  active: boolean
}

export type VisitsPageSideNav = {
  open?: VisitsPageSideNavItem[]
  closed?: VisitsPageSideNavItem[]
  unknown?: VisitsPageSideNavItem[] // for visits with no session template (old, migrated data)
}

export type FlashData = Record<string, string | string[] | Record<string, string | string[]>[]>

export type VisitsReviewListItem = {
  actionUrl: string
  bookedByNames: string[]
  prisonerNumbers: string[]
  reference: string
  type: NotificationType
  visitDates: string[]
}

export interface Prison extends PrisonName {
  policyNoticeDaysMin: number
  maxTotalVisitors: number
}

export type FilterField = { id: string; label: string; items: { label: string; value: string; checked: boolean }[] }
