import type { Request, Response } from 'express'
import { clearSession, getSupportTypeDescriptions } from '../visitorUtils'

export default class Confirmation {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'updateVisitSessionData' : 'visitSessionData']

    res.locals.prisoner = sessionData.prisoner
    res.locals.visit = sessionData.visit
    res.locals.visitRestriction = sessionData.visitRestriction
    res.locals.visitors = sessionData.visitors
    res.locals.mainContact = sessionData.mainContact
    res.locals.visitReference = sessionData.visitReference
    res.locals.additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      sessionData.visitorSupport,
    )

    clearSession(req)

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/confirmation`)
  }
}
