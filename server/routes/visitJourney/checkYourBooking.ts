import type { Request, Response } from 'express'
import logger from '../../../logger'
import config from '../../config'
import AuditService from '../../services/auditService'
import NotificationsService from '../../services/notificationsService'
import VisitSessionsService from '../../services/visitSessionsService'
import { getSupportTypeDescriptions } from '../visitorUtils'

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

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/checkYourBooking`, {
      offenderNo,
      mainContact: visitSessionData.mainContact,
      prisoner: visitSessionData.prisoner,
      visit: visitSessionData.visit,
      visitRestriction: visitSessionData.visitRestriction,
      visitors: visitSessionData.visitors,
      additionalSupport,
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
      const bookedVisit = await this.visitSessionsService.updateVisit({
        username: res.locals.user?.username,
        visitData: req.session.visitSessionData,
        visitStatus: 'BOOKED',
      })

      req.session.visitSessionData.visitStatus = bookedVisit.visitStatus

      await this.auditService.bookedVisit(
        req.session.visitSessionData.visitReference,
        visitSessionData.prisoner.offenderNo,
        'HEI',
        visitSessionData.visitors.map(visitor => visitor.personId.toString()),
        visitSessionData.visit.startTimestamp,
        visitSessionData.visit.endTimestamp,
        visitSessionData.visitRestriction,
        res.locals.user?.username,
        res.locals.appInsightsOperationId,
      )

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = visitSessionData.mainContact.phoneNumber.replace(/\s/g, '')

          await this.notificationsService.sendBookingSms({
            phoneNumber,
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
          logger.info(`Booking SMS sent for ${visitSessionData.visitReference}`)
        } catch (error) {
          logger.error(`Failed to send SMS for booking ${visitSessionData.visitReference}`)
        }
      }
    } catch (error) {
      return res.render('pages/bookAVisit/checkYourBooking', {
        errors: [
          {
            msg: 'Failed to make this reservation. You can try to submit again.',
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
      })
    }

    const urlPrefix = isUpdate ? `/visit/${visitSessionData.previousVisitReference}/update` : '/book-a-visit'

    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
