import type { Request, Response } from 'express'
import { requestMethodsBooking } from '../../constants/requestMethods'
import AuditService from '../../services/auditService'
import getUrlPrefix from './visitJourneyUtils'
import { VisitService } from '../../services'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { SanitisedError } from '../../sanitisedError'

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

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)

    let { allowOverBooking } = req.session

    if (req.body.confirmOverbooking === 'yes') {
      allowOverBooking = true
    } else if (req.body.confirmOverbooking === 'no') {
      return res.redirect(`${urlPrefix}/select-date-and-time`)
    }

    try {
      // 'book' the visit: complete the visit application and get BOOKED visit
      const bookedVisit = await this.visitService.bookVisit({
        username: res.locals.user.username,
        applicationReference: visitSessionData.applicationReference,
        applicationMethod: visitSessionData.requestMethod,
        allowOverBooking,
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
    } catch (error) {
      if (error.status === 422) {
        const validationErrors =
          (error as SanitisedError<ApplicationValidationErrorResponse>)?.data?.validationErrors ?? []

        if (validationErrors.includes('APPLICATION_INVALID_NO_SLOT_CAPACITY')) {
          return res.redirect(`${urlPrefix}/confirm-overbooking`)
        }
      }

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
        urlPrefix,
      })
    }

    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
