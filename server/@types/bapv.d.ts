import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'

export type PrisonerDetailsItem = {
  classes: string
  html: string
}

export type PrisonerAlertItem = [
  {
    text: string
  },
  {
    text: string
  },
  {
    text: string
  },
  {
    html: string
  },
  {
    html: string
  }
]

export type UpcomingVisitItem = [
  {
    text: string
  },
  {
    text: string
  },
  {
    text: string
  },
  {
    html: string
  }
]

type VisitVisitor = {
  visitId: number
  nomisPersonId: number
  leadVisitor: boolean
}

export type Visit = {
  id: number
  prisonerId: string
  prisonId: string
  visitRoom: string
  visitType: string
  visitTypeDescription: string
  visitStatus: string
  visitStatusDescription: string
  startTimestamp: string
  endTimestamp: string
  reasonableAdjustments: string
  visitors: VisitVisitor[]
  sessionId: number
}

export type PrisonerProfile = {
  displayName: string
  displayDob: string
  activeAlerts: PrisonerAlertItem[]
  flaggedAlerts: Alert[]
  inmateDetail: InmateDetail
  convictedStatus: 'Convicted' | 'Remand'
  visitBalances: VisitBalances
  upcomingVisits: UpcomingVisitItem[]
}

export type SystemToken = (arg0?: string) => Promise<string>

export type BAPVVisitBalances = VisitBalances & {
  nextIepAdjustDate?: string
  nextPrivIepAdjustDate?: string
}

export type Restriction = {
  restrictionType: string
  restrictionTypeDescription: string
  startDate: string
  expiryDate: string
  globalRestriction: boolean
  comment: string
}

export type Address = {
  addressType: string
  flat: string
  premise: string
  street: string
  locality: string
  town: string
  postalCode: string
  county: string
  country: string
  comment: string
  primary: boolean
  noFixedAddress: boolean
  startDate: string
  endDate: string
  phones: Phone[]
  addressUsages: AddressUsage[]
}

export type Phone = {
  number: string
  type: string
  ext: string
}

export type AddressUsage = {
  addressUsage: string
  addressUsageDescription: string
  activeFlag: boolean
}

export type Contact = {
  personId: number
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  relationshipCode: string
  relationshipDescription: string
  contactType: string
  contactTypeDescription: string
  approvedVisitor: boolean
  emergencyContact: boolean
  nextOfKin: boolean
  restrictions: Restriction[]
  addresses: Address[]
  commentText: string
}
