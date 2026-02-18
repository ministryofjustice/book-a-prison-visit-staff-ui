import HeaderFooterSharedData from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterSharedData'
import { ValidationError } from 'express-validator'
import { PrisonUser } from '../../interfaces/hmppsUser'
import { CancelledVisitInfo, FlashFormValues, MoJAlert, Prison, VisitorListItem, VisitSessionData } from '../bapv'
import {
  BookerSearchResultsDto,
  SocialContactsDto,
  VisitorInfoDto,
  VisitorRequestForReviewDto,
} from '../../data/orchestrationApiTypes'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    visitorList: { visitors: VisitorListItem[] } // TODO move into VisitSessionData
    adultVisitors: { adults: VisitorListItem[] } // TODO move into VisitSessionData
    visitSessionData: VisitSessionData
    selectedEstablishment: Prison & { isEnabledForPublic: boolean }
    visitBlockDate?: string // format YYYY-MM-DD
    cancelledVisitInfo?: CancelledVisitInfo

    // Booker management
    // matched booker accounts from an email search (sorted, most recent 'active' account first)
    matchedBookers?: BookerSearchResultsDto[]

    // non-linked visitors for linking to a booker's prisoner
    bookerLinkVisitor?: {
      reference: string
      prisonerId: string
      nonLinkedContacts: SocialContactsDto[]
    }

    // Visitor request from booker for processing
    visitorRequestJourney?: {
      visitorRequest: VisitorRequestForReviewDto
      linkedVisitors: VisitorInfoDto[]
    }
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

      flash(type: 'messages', message: MoJAlert): number
      flash(type: 'messages'): MoJAlert[]
    }

    interface Locals {
      user: PrisonUser
      feComponents?: {
        sharedData?: HeaderFooterSharedData
      }
      appInsightsOperationId?: string
    }
  }
}
