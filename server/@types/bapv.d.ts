import { OffenderRestriction } from '../data/prisonApiTypes'
import {
  ApplicationMethodType,
  NotificationType,
  PrisonDto,
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
  alerts: Alert[]
  flaggedAlerts: Alert[]
  prisonerDetails: {
    prisonerId: string
    firstName: string
    lastName: string
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
  allowOverBooking: boolean
  prisoner: {
    firstName: string
    lastName: string
    offenderNo: string
    location: string
    alerts?: Alert[]
    restrictions?: OffenderRestriction[]
  }
  visitSlot?: VisitSlot
  originalVisitSlot?: VisitSlot
  visitRestriction?: 'OPEN' | 'CLOSED'
  visitorIds?: number[]
  visitors?: VisitorListItem[]
  visitorSupport?: VisitorSupport
  mainContact?: {
    contactId?: number
    relationshipDescription?: string
    phoneNumber?: string
    email?: string
    contactName?: string
  }
  applicationReference?: string
  visitReference?: string // only set during an update journey; during initial booking it's unknown
  visitStatus?: Visit['visitStatus']
  requestMethod?: ApplicationMethodType
  daysUntilBanExpiry?: number
  overrideBookingWindow?: boolean
}

export type MojAlert = {
  title: string
  text: string
  variant: 'warning' | 'error' | 'information' | 'success'
  showTitleAsHeading: boolean
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
  queryParams: string
  active: boolean
}

export type VisitsPageSideNav = Map<string, VisitsPageSideNavItem[]>

export type FlashData = Record<string, string | string[] | Record<string, string | string[]>[] | MojAlert[]>

export type VisitsReviewListItem = {
  actionUrl: string
  bookedByNames: string[]
  prisonerNumbers: string[]
  reference: string
  type: NotificationType
  visitDates: string[]
}

export interface Prison extends Omit<PrisonDto, 'code'> {
  prisonId: string
}

export type FilterField = { id: string; label: string; items: { label: string; value: string; checked: boolean }[] }

export type BookOrUpdate = 'book' | 'update'
