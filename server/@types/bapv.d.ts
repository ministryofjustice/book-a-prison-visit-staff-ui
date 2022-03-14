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
    html: string
  },
  {
    html: string
  }
]

export type PastVisitItem = [
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
  },
  {
    text: string
  }
]

export type VisitorListItem = {
  personId: number
  name: string
  dateOfBirth?: string
  adult?: boolean
  relationshipDescription: string
  address?: string
  restrictions: Restriction[]
  selected?: boolean
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
  pastVisits: PastVisitItem[]
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
  dateOfBirth?: string
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

// Visit slots, for representing data derived from VisitSessions
export type VisitSlot = {
  id: string
  startTimestamp: string
  endTimestamp: string
  availableTables: number
  visitRoomName: string
}

export type VisitSlotsForDay = {
  date: string
  slots: {
    morning: VisitSlot[]
    afternoon: VisitSlot[]
  }
}

export type VisitSlotList = {
  [key: string]: VisitSlotsForDay[] // keyed on month value, e.g. 'February 2022'
}

export type FormError = {
  value: string
  msg: string
  param: string
  location: string
}

export type VisitSessionData = {
  prisoner: {
    name: string
    offenderNo: string
    dateOfBirth: string
    location: string
  }
  visit?: VisitSlot
  visitors?: VisitorListItem[]
  additionalSupport?: {
    required: boolean
    keys?: string[]
    other?: string
  }
  mainContact?: {
    contact?: VisitorListItem
    phoneNumber: string
    contactName?: string
  }
  visitId?: string
}
