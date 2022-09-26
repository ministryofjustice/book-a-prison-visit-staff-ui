import type { Request, Response } from 'express'
import logger from '../../../logger'
import config from '../../config'
import { OutcomeDto } from '../../data/visitSchedulerApiTypes'
import AuditService from '../../services/auditService'
import NotificationsService from '../../services/notificationsService'
import VisitSessionsService from '../../services/visitSessionsService'
import { getSupportTypeDescriptions } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class CheckYourBooking {
  constructor(
    private readonly mode: string,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    res.render('pages/bookAVisit/checkYourBooking', {
      offenderNo,
      mainContact: visitSessionData.mainContact,
      prisoner: visitSessionData.prisoner,
      visit: visitSessionData.visit,
      visitRestriction: visitSessionData.visitRestriction,
      visitors: visitSessionData.visitors,
      additionalSupport,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.previousVisitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(
      req.session.availableSupportTypes,
      visitSessionData.visitorSupport,
    )

    try {
      // change reserved visit to have the latest data
      await this.visitSessionsService.changeReservedVisit({
        username: res.locals.user?.username,
        visitSessionData,
      })
      // 'book' the visit: set it's status to BOOKED
      const bookedVisit = await this.visitSessionsService.bookVisit({
        username: res.locals.user?.username,
        visitSessionData,
      })

      visitSessionData.visitStatus = bookedVisit.visitStatus

      await this.auditService.bookedVisit({
        visitReference: visitSessionData.visitReference,
        prisonerId: visitSessionData.prisoner.offenderNo,
        visitorIds: visitSessionData.visitors.map(visitor => visitor.personId.toString()),
        startTimestamp: visitSessionData.visit.startTimestamp,
        endTimestamp: visitSessionData.visit.endTimestamp,
        visitRestriction: visitSessionData.visitRestriction,
        username: res.locals.user?.username,
        operationId: res.locals.appInsightsOperationId,
      })

      if (isUpdate) {
        const outcome: OutcomeDto = {
          outcomeStatus: 'SUPERSEDED_CANCELLATION',
          text: visitSessionData.visitReference,
        }

        await this.visitSessionsService.cancelVisit({
          username: res.locals.user?.username,
          reference: visitSessionData.previousVisitReference,
          outcome,
        })

        await this.auditService.cancelledVisit({
          visitReference: visitSessionData.previousVisitReference,
          prisonerId: visitSessionData.prisoner.offenderNo,
          reason: `${outcome.outcomeStatus}: Superseded by ${outcome.text}`,
          username: res.locals.user?.username,
          operationId: res.locals.appInsightsOperationId,
        })
      }

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = visitSessionData.mainContact.phoneNumber.replace(/\s/g, '')
          await this.notificationsService[`send${isUpdate ? 'Update' : 'Booking'}Sms`]({
            phoneNumber,
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
          logger.info(`${isUpdate ? 'Update' : 'Booking'} SMS sent for ${visitSessionData.visitReference}`)
        } catch (error) {
          logger.error(`Failed to send SMS for booking ${visitSessionData.visitReference}`)
        }
      }
    } catch (error) {
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
        visit: visitSessionData.visit,
        visitRestriction: visitSessionData.visitRestriction,
        visitors: visitSessionData.visitors,
        additionalSupport,
        urlPrefix: getUrlPrefix(isUpdate, visitSessionData.previousVisitReference),
      })
    }

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.previousVisitReference)
    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
