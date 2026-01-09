import {
  Alert,
  ApplicationMethodType,
  NotificationType,
  OffenderRestriction,
  PrisonDto,
  PrisonerProfileDto,
  Visit,
  VisitorSupport,
  VisitSummary,
} from '../data/orchestrationApiTypes'
import type { CalendarVisitSession } from '../services/visitSessionsService'
import type { Restriction } from '../data/prisonerContactRegistryApiTypes'

type TextOrHtml = { text: string; html?: never } | { text?: never; html: string }

export type FlashFormValues = Record<string, unknown>

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
  restrictions: OffenderRestriction[]
  prisonerDetails: {
    prisonerId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    cellLocation: string
    prisonName: string
    convictedStatus: PrisonerProfileDto['convictedStatus']
    category: string
    incentiveLevel: string
    visitBalances: PrisonerProfileDto['visitBalances']
  }
  visitsByMonth: Map<string, { upcomingCount: number; pastCount: number; visits: VisitSummary[] }>
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
  prisonId: string
  allVisitSessions?: CalendarVisitSession[]
  selectedVisitSession?: {
    date: string
    sessionTemplateReference: string
    startTime: string
    endTime: string
    availableTables: number
    capacity: number
  }
  originalVisitSession?: {
    date: string
    sessionTemplateReference: string
    startTime: string
    endTime: string
    visitRestriction: 'OPEN' | 'CLOSED' | undefined // 'undefined' for migrated visits
  }
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
  publicBooker?: boolean // true if booking originally made in public service
}

export type MoJAlert = {
  variant: 'information' | 'success' | 'warning' | 'error'
  title: string
  showTitleAsHeading?: boolean
  dismissible?: boolean
  classes?: string
} & TextOrHtml

export type VisitInformation = {
  reference: string
  prisonNumber: string
  prisonerName: string
  mainContact: string
  visitDate: string
  visitTime: string
  visitStatus: Visit['visitStatus']
  visitSubStatus: Visit['visitSubStatus']
}

export type VisitsPageSideNavItem = {
  reference: string
  times: string
  queryParams: string
  active: boolean
}

export type VisitsPageSideNav = Map<string, VisitsPageSideNavItem[]>

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

export type FilterField = {
  id: string
  label: string
  items: {
    label: string
    value: string
    checked: boolean
  }[]
}

export type BookOrUpdate = 'book' | 'update'

export type CancelledVisitInfo = {
  prisonerId: string
  startTimestamp: string
  endTimestamp: string
  hasEmailAddress: boolean
  hasMobileNumber: boolean
}

export type GOVUKTag = TextOrHtml & {
  classes?: string
}

export type GOVUKTableRow = GOVUKTableRowItem[]

type GOVUKTableRowItem = TextOrHtml & {
  classes?: string
  attributes?: { 'data-test': string }
}
