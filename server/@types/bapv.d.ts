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
    text: string
  }
]

type PrisonerVisitVisitor = {
  visitId: number
  nomisPersonId: number
  leadVisitor: boolean
}

export type PrisonerVisit = {
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
  visitors: PrisonerVisitVisitor[]
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
}

export type SystemToken = (arg0?: string) => Promise<string>

export type BAPVVisitBalances = VisitBalances & {
  nextIepAdjustDate?: string
  nextPrivIepAdjustDate?: string
}
