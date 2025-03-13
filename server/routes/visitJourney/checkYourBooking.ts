import type { Request, Response } from 'express'
import { validationResult } from 'express-validator'
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

    const { confirmOverBooking } = req.body // this will be set if we have come from overbooking confirmation page
    if (confirmOverBooking === 'no') {
      return res.redirect(`${urlPrefix}/select-date-and-time`) // i.e. return early if we're going to
    }
    if (confirmOverBooking === 'yes') {
      visitSessionData.allowOverBooking = true
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/check-your-booking/overbooking`)
    }

    try {
      // 'book' the visit: complete the visit application and get BOOKED visit
      const bookedVisit = await this.visitService.bookVisit({
        username: res.locals.user.username,
        applicationReference: visitSessionData.applicationReference,
        applicationMethod: visitSessionData.requestMethod,
        allowOverBooking: visitSessionData.allowOverBooking,
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
          return res.redirect(`${urlPrefix}/check-your-booking/overbooking`)
        }
        if (validationErrors.includes('APPLICATION_INVALID_NON_ASSOCIATION_VISITS')) {
          visitSessionData.validationError = 'APPLICATION_INVALID_NON_ASSOCIATION_VISITS'
          return res.redirect(`${urlPrefix}/select-date-and-time`)
        }
        if (validationErrors.includes('APPLICATION_INVALID_VISIT_ALREADY_BOOKED')) {
          visitSessionData.validationError = 'APPLICATION_INVALID_VISIT_ALREADY_BOOKED'
          return res.redirect(`${urlPrefix}/select-date-and-time`)
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
