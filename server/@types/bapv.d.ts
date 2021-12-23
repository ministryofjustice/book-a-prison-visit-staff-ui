import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'

export type PrisonerDetailsItem = { classes: string } & (
  | { html: string; text?: never }
  | { html?: never; text: string }
)

export type PrisonerProfile = { inmateDetail: InmateDetail; visitBalances: VisitBalances }

export type SystemToken = (arg0?: string) => Promise<string>
