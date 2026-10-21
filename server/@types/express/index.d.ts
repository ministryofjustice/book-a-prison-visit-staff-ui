import type SharedData from '@ministryofjustice/hmpps-connect-dps-components/dist/types/SharedData'
import { ValidationError } from 'express-validator'
import { PrisonUser } from '../../interfaces/hmppsUser'
import { CancelledVisitInfo, FlashFormValues, MoJAlert, Prison, VisitorListItem, VisitSessionData } from '../bapv'
import {
  BookerSearchResultsDto,
  SessionSchedule,
  SocialContactsDto,
  VisitorInfoDto,
  VisitorRequestForReviewDto,
} from '../../data/orchestrationApiTypes'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string

    // Prison ID of the user's selected establishment within the service
    // (distinct from active case load as this could be changed by the user during a journey)
    selectedEstablishmentId: string

    /**
     * @deprecated Use `selectedEstablishmentId` instead.
     * TODO to handle old sessions during deployment; can be removed in a subsequent deployment
     */
    selectedEstablishment?: Prison

    // Visit booking journey
    visitSessionData: VisitSessionData
    visitorList: { visitors: VisitorListItem[] } // TODO move into VisitSessionData
    adultVisitors: { adults: VisitorListItem[] } // TODO move into VisitSessionData

    // Cancel a visit journey
    cancelledVisitInfo?: CancelledVisitInfo

    // Block visit date or session journey
    blockDateOrSession?: {
      backLinkHref: string
      date: string // format YYYY-MM-DD
      sessions?: SessionSchedule[]
      selectedSession?: SessionSchedule
    }

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
      returnTo: 'booker-details' | 'manage-bookers'
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

      context?: {
        selectedEstablishment?: Prison
      }

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
        sharedData?: SharedData
      }

      appInsightsOperationId?: string

      selectedEstablishment?: Prison
    }
  }
}
