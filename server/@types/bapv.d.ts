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
    text: string
  },
  {
    text: string
  }
]

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
