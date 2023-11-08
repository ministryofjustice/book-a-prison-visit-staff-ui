import { SupportType } from '../../data/orchestrationApiTypes'
import { VisitorListItem, VisitSessionData } from '../bapv'
import { PrisonName } from '../../data/prisonRegisterApiTypes'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    availableSupportTypes: SupportType[]
    visitorList: { visitors: VisitorListItem[] }
    adultVisitors: { adults: VisitorListItem[] }
    slotsList: VisitSlotList
    visitSessionData: VisitSessionData
    selectedEstablishment: PrisonName
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
    }
  }
}
