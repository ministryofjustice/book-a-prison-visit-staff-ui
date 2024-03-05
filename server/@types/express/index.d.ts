import { VisitorListItem, VisitSessionData, Prison } from '../bapv'
import { UserDetails } from '../../services/userService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    visitorList: { visitors: VisitorListItem[] }
    adultVisitors: { adults: VisitorListItem[] }
    slotsList: VisitSlotList
    visitSessionData: VisitSessionData
    selectedEstablishment: Prison
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
    }
  }
}
