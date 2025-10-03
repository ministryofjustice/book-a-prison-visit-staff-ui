import type { Request } from 'express'
import type { SessionData } from 'express-session'
import { FlashFormValues } from '../@types/bapv'

export const getFlashFormValues = (req: Request): FlashFormValues => {
  return req.flash('formValues')?.[0] || {}
}

export const clearSession = (req: Request): void => {
  ;['visitorList', 'adultVisitors', 'slotsList', 'visitSessionData', 'cancelledVisitInfo'].forEach(
    (sessionItem: keyof SessionData) => {
      delete req.session[sessionItem]
    },
  )
}
