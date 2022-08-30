import type { Request, Response } from 'express'
import { clearSession, getSupportTypeDescriptions } from '../visitorUtils'

export default class Confirmation {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    res.locals.prisoner = visitSessionData.prisoner
    res.locals.visit = visitSessionData.visit
    res.locals.visitRestriction = visitSessionData.visitRestriction
    res.locals.visitors = visitSessionData.visitors
    res.locals.mainContact = visitSessionData.mainContact
    res.locals.visitReference = visitSessionData.visitReference
    res.locals.additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    clearSession(req)

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/confirmation`)
  }
}
