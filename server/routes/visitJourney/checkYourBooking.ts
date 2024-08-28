import type { Request, Response } from 'express'
import { requestMethodsBooking } from '../../constants/requestMethods'
import AuditService from '../../services/auditService'
import getUrlPrefix from './visitJourneyUtils'
import { VisitService } from '../../services'

export default class CheckYourBooking {
  constructor(
    private readonly mode: string,
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const additionalSupport = visitSessionData.visitorSupport.description.length
      ? visitSessionData.visitorSupport.description
      : ''

    res.render('pages/bookAVisit/checkYourBooking', {
      offenderNo,
      mainContact: visitSessionData.mainContact,
      prisoner: visitSessionData.prisoner,
      visitSlot: visitSessionData.visitSlot,
      visitRestriction: visitSessionData.visitRestriction,
      visitors: visitSessionData.visitors,
      additionalSupport,
      requestMethod: requestMethodsBooking[visitSessionData.requestMethod],
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { prisonId } = req.session.selectedEstablishment
    const { offenderNo } = visitSessionData.prisoner

    try {
      // 'book' the visit: complete the visit application and get BOOKED visit
      const bookedVisit = await this.visitService.bookVisit({
        username: res.locals.user.username,
        applicationReference: visitSessionData.applicationReference,
        applicationMethod: visitSessionData.requestMethod,
      })

      visitSessionData.visitReference = bookedVisit.reference
      visitSessionData.visitStatus = bookedVisit.visitStatus

      await this.auditService.bookedVisit({
        applicationReference: visitSessionData.applicationReference,
        visitReference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitRestriction: visitSessionData.visitRestriction,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })
    } catch {
      return res.render('pages/bookAVisit/checkYourBooking', {
        errors: [
          {
            msg: 'Failed to book this visit. You can try to submit again.',
            param: 'id',
          },
        ],
        offenderNo,
        mainContact: visitSessionData.mainContact,
        prisoner: visitSessionData.prisoner,
        visitSlot: visitSessionData.visitSlot,
        visitRestriction: visitSessionData.visitRestriction,
        visitors: visitSessionData.visitors,
        additionalSupport: visitSessionData.visitorSupport.description,
        urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
      })
    }

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)
    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
