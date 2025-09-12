import HeaderFooterMeta from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterMeta'
import { ValidationError } from 'express-validator'
import { PrisonUser } from '../../interfaces/hmppsUser'
import { CancelledVisitInfo, FlashFormValues, MojAlert, Prison, VisitorListItem, VisitSessionData } from '../bapv'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    visitorList: { visitors: VisitorListItem[] } // TODO move into VisitSessionData
    adultVisitors: { adults: VisitorListItem[] } // TODO move into VisitSessionData
    slotsList: VisitSlotList // TODO remove
    visitSessionData: VisitSessionData
    selectedEstablishment: Prison
    visitBlockDate?: string // format YYYY-MM-DD
    cancelledVisitInfo?: CancelledVisitInfo
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

      flash(type: 'errors', message: ValidationError[]): number
      flash(type: 'errors'): ValidationError[]

      flash(type: 'formValues', message: FlashFormValues): number
      flash(type: 'formValues'): FlashFormValues[]

      flash(type: 'messages', message: MojAlert): number
      flash(type: 'messages'): MojAlert[]
    }

    interface Locals {
      user: PrisonUser
      feComponentsMeta?: HeaderFooterMeta
    }
  }
}
