import { VisitorListItem, VisitSessionData } from '../bapv'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    prisonerName: string
    offenderNo: string
    visitorList?: VisitorListItem[]
    adultVisitors?: VisitorListItem[]
    slotsList: VisitSlotList
    timeOfDay: string
    dayOfTheWeek: string
    contact: string
    phoneNumber: string
    someoneElseName: string
    visitSessionData: VisitSessionData
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
    }
  }
}
