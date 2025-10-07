import type { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { requestMethodsBooking } from '../../constants/requestMethods'
import AuditService from '../../services/auditService'
import { getUrlPrefix, validationErrorsToMoJAlert } from './visitJourneyUtils'
import { VisitService } from '../../services'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { SanitisedError } from '../../sanitisedError'
import { BookOrUpdate } from '../../@types/bapv'

export default class CheckYourBooking {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner
    const prisonerName = `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`

    const additionalSupport = visitSessionData.visitorSupport.description.length
      ? visitSessionData.visitorSupport.description
      : ''

    res.render('pages/bookAVisit/checkYourBooking', {
      offenderNo,
      mainContact: visitSessionData.mainContact,
      prisoner: visitSessionData.prisoner,
      prisonerName,
      visitSession: visitSessionData.selectedVisitSession,
      visitRestriction: visitSessionData.visitRestriction,
      visitors: visitSessionData.visitors,
      additionalSupport,
      requestMethod: requestMethodsBooking[visitSessionData.requestMethod],
      urlPrefix: getUrlPrefix(isUpdate),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { prisonId } = req.session.selectedEstablishment
    const { offenderNo } = visitSessionData.prisoner
    const prisonerName = `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`

    const urlPrefix = getUrlPrefix(isUpdate)

    const confirmOverBooking = req.body?.confirmOverBooking ?? '' // this will be set if we have come from overbooking confirmation page
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
      const bookedVisit = isUpdate
        ? await this.visitService.updateVisit({
            username: res.locals.user.username,
            applicationReference: visitSessionData.applicationReference,
            applicationMethod: visitSessionData.requestMethod,
            allowOverBooking: visitSessionData.allowOverBooking,
          })
        : await this.visitService.bookVisit({
            username: res.locals.user.username,
            applicationReference: visitSessionData.applicationReference,
            applicationMethod: visitSessionData.requestMethod,
            allowOverBooking: visitSessionData.allowOverBooking,
          })

      visitSessionData.visitReference = bookedVisit.reference
      visitSessionData.visitStatus = bookedVisit.visitStatus

      const { date, startTime, endTime } = visitSessionData.selectedVisitSession
      await this.auditService.bookedVisit({
        applicationReference: visitSessionData.applicationReference,
        visitReference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
        startTimestamp: `${date}T${startTime}:00`,
        endTimestamp: `${date}T${endTime}:00`,
        visitRestriction: visitSessionData.visitRestriction,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })
    } catch (error) {
      if (error.status === 422) {
        const validationErrors =
          (error as SanitisedError<ApplicationValidationErrorResponse>)?.data?.validationErrors ?? []

        const { mojAlert, url } = validationErrorsToMoJAlert(
          prisonerName,
          `${visitSessionData.selectedVisitSession.date}T${visitSessionData.selectedVisitSession.startTime}:00`,
          validationErrors,
        )

        if (mojAlert) {
          req.flash('messages', mojAlert)
          return res.redirect(`${urlPrefix}/${url}`)
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
        prisonerName,
        visitSession: visitSessionData.selectedVisitSession,
        visitRestriction: visitSessionData.visitRestriction,
        visitors: visitSessionData.visitors,
        additionalSupport: visitSessionData.visitorSupport.description,
        urlPrefix,
      })
    }

    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
