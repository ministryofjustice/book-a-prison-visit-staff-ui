import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'
import { VisitorSupport } from '../data/visitSchedulerApiTypes'

export type PrisonerDetailsItem = {
  html?: string
  text?: string
}

export type PrisonerAlertItem = [
  {
    text: string
    attributes?: {
      'data-test': string
    }
  },
  {
    text: string
    attributes?: {
      'data-test': string
    }
  },
  {
    text: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  }
]

export type UpcomingVisitItem = [
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    text: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  }
]

export type PastVisitItem = [
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    text: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    html: string
    attributes?: {
      'data-test': string
    }
  },
  {
    text: string
    attributes?: {
      'data-test': string
    }
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
  banned: boolean
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

// Visit slots, for representing data derived from VisitSessions
export type VisitSlot = {
  id: string
  startTimestamp: string
  endTimestamp: string
  availableTables: number
  visitRoomName: string
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
  visitRestriction?: 'OPEN' | 'CLOSED'
  visitors?: VisitorListItem[]
  visitorSupport?: VisitorSupport[]
  mainContact?: {
    contact?: VisitorListItem
    phoneNumber: string
    contactName?: string
  }
  visitReference?: string
}

export type VisitInformation = {
  reference: string
  prisonNumber: string
  prisonerName: string
  mainContact: string
  visitDate: string
  visitTime: string
}
