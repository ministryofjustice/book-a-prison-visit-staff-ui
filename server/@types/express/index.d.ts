import { SupportType } from '../../data/visitSchedulerApiTypes'
import { VisitorListItem, VisitSessionData } from '../bapv'

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
    timeOfDay: string
    dayOfTheWeek: string
    visitSessionData: VisitSessionData
    updateVisitSessionData: VisitSessionData
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
