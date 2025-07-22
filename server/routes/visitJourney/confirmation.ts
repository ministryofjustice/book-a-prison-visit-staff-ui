import type { Request, Response } from 'express'
import { clearSession } from '../visitorUtils'
import { isMobilePhoneNumber } from '../../utils/utils'

export default class Confirmation {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    res.locals.isUpdate = isUpdate
    res.locals.prisoner = visitSessionData.prisoner
    res.locals.visitSlot = visitSessionData.visitSlot
    res.locals.visitRestriction = visitSessionData.visitRestriction
    res.locals.visitors = visitSessionData.visitors
    res.locals.mainContact = visitSessionData.mainContact
    res.locals.visitReference = visitSessionData.visitReference
    res.locals.additionalSupport = visitSessionData.visitorSupport.description
    res.locals.hasMobileNumber = isMobilePhoneNumber(visitSessionData.mainContact.phoneNumber)
    res.locals.hasEmailAddress = !!visitSessionData.mainContact.email?.length

    clearSession(req)

    res.render('pages/bookAVisit/confirmation')
  }
}
