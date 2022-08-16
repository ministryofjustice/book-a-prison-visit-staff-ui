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
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const { offenderNo } = sessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(req.session.availableSupportTypes, sessionData.visitorSupport)

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/checkYourBooking`, {
      offenderNo,
      mainContact: sessionData.mainContact,
      prisoner: sessionData.prisoner,
      visit: sessionData.visit,
      visitRestriction: sessionData.visitRestriction,
      visitors: sessionData.visitors,
      additionalSupport,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const { offenderNo } = sessionData.prisoner

    const additionalSupport = getSupportTypeDescriptions(req.session.availableSupportTypes, sessionData.visitorSupport)

    try {
      const bookedVisit = await this.visitSessionsService.updateVisit({
        username: res.locals.user?.username,
        visitData: req.session.visitSessionData,
        visitStatus: 'BOOKED',
      })

      req.session.visitSessionData.visitStatus = bookedVisit.visitStatus

      await this.auditService.bookedVisit(
        req.session.visitSessionData.visitReference,
        sessionData.prisoner.offenderNo,
        'HEI',
        sessionData.visitors.map(visitor => visitor.personId.toString()),
        res.locals.user?.username,
        res.locals.appInsightsOperationId,
      )

      if (config.apis.notifications.enabled) {
        try {
          const phoneNumber = sessionData.mainContact.phoneNumber.replace(/\s/g, '')

          await this.notificationsService.sendBookingSms({
            phoneNumber,
            visit: sessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: sessionData.visitReference,
          })
          logger.info(`Booking SMS sent for ${sessionData.visitReference}`)
        } catch (error) {
          logger.error(`Failed to send SMS for booking ${sessionData.visitReference}`)
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
        mainContact: sessionData.mainContact,
        prisoner: sessionData.prisoner,
        visit: sessionData.visit,
        visitRestriction: sessionData.visitRestriction,
        visitors: sessionData.visitors,
        additionalSupport,
      })
    }

    const urlPrefix = isUpdate ? `/visit/${sessionData.visitReference}/update` : '/book-a-visit'

    return res.redirect(`${urlPrefix}/confirmation`)
  }
}
