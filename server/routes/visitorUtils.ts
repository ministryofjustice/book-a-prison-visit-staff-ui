import type { Request } from 'express'
import type { SessionData } from 'express-session'
import { FlashFormValues } from '../@types/bapv'

export const getFlashFormValues = <T>(req: Request<T>): FlashFormValues => {
  return req.flash('formValues')?.[0] || {}
}

export const clearSession = <T>(req: Request<T>): void => {
  const sessionDataKeysToClear: Array<keyof SessionData> = [
    'visitorList',
    'adultVisitors',
    'visitSessionData',
    'cancelledVisitInfo',
  ]
  sessionDataKeysToClear.forEach(sessionItem => {
    delete req.session[sessionItem]
  })
}
