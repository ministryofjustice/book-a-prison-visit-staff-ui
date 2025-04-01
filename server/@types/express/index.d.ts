import HeaderFooterMeta from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterMeta'
import { PrisonUser } from '../../interfaces/hmppsUser'
import { MojAlert, Prison, VisitorListItem, VisitSessionData } from '../bapv'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    visitorList: { visitors: VisitorListItem[] }
    adultVisitors: { adults: VisitorListItem[] }
    slotsList: VisitSlotList
    visitSessionData: VisitSessionData
    selectedEstablishment: Prison
    visitBlockDate?: string // format YYYY-MM-DD
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void

      flash(type: 'errors'): ValidationError[]
      flash(type: 'errors', message: ValidationError[]): number
      flash(type: 'formValues'): Record<string, string | string[] | number[]>[]
      flash(type: 'formValues', message: Record<string, string | string[] | number[]>): number
      flash(type: 'messages'): MojAlert[]
      flash(type: 'messages', message: MojAlert): number
    }

    interface Locals {
      user: PrisonUser
      feComponentsMeta?: HeaderFooterMeta
    }
  }
}
