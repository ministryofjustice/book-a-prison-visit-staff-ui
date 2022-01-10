import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'

export type PrisonerDetailsItem = {
  classes: string
  html: string
}

export type FlaggedAlert = {
  alertCode: string
  alertCodeDescription: string
}

export type PrisonerProfile = {
  displayName: string
  displayDob: string
  flaggedAlerts: FlaggedAlert[]
  inmateDetail: InmateDetail
  visitBalances: VisitBalances
}

export type SystemToken = (arg0?: string) => Promise<string>
