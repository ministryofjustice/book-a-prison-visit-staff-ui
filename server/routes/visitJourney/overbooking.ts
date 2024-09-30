import type { Request, Response } from 'express'
import getUrlPrefix from './visitJourneyUtils'
import { VisitSessionsService } from '../../services'

export default class Overbooking {
  constructor(
    private readonly mode: string,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  async viewFromConfirm(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)

    const visitSession = await this.visitSessionsService.getSingleVisitSession({
      prisonCode: visitSessionData.visitSlot.prisonId,
      sessionDate: visitSessionData.visitSlot.startTimestamp.split('T')[0],
      sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
      username: req.user.username,
    })

    const bookingsCount =
      visitSessionData.visitSlot.visitRestriction === 'OPEN'
        ? visitSession.openVisitBookedCount
        : visitSession.closedVisitBookedCount

    const maxCapacity =
      visitSessionData.visitSlot.visitRestriction === 'OPEN'
        ? visitSession.openVisitCapacity
        : visitSession.closedVisitCapacity

    res.render('pages/bookAVisit/overbooking', {
      bookingsCount,
      maxCapacity,
      visitSession,
      urlPrefix,
    })
  }
}
