import { RequestHandler } from 'express'
import { differenceInCalendarDays } from 'date-fns'
import { VisitService } from '../../services'
import { clearSession } from '../visitorUtils'
import { VisitSessionData } from '../../@types/bapv'
import { convertToTitleCase } from '../../utils/utils'
import { getPrisonerLocation, isPublicBooking } from './visitUtils'

export default class UpdateVisitController {
  public constructor(private readonly visitService: VisitService) {}

  public startVisitUpdate(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params
      const { username } = res.locals.user

      const visitDetails = await this.visitService.getVisitDetailed({ username, reference })
      const { prison, prisoner } = visitDetails

      const prisonerInVisitPrison = prison.prisonId === prisoner.prisonId
      const visitInSelectedEstablishment = prison.prisonId === req.session.selectedEstablishment.prisonId
      if (!prisonerInVisitPrison || !visitInSelectedEstablishment) {
        return res.redirect(`/visit/${visitDetails.reference}`)
      }

      // clean session then pre-populate with visit to update
      clearSession(req)

      const visitRestriction = visitDetails.visitRestriction === 'UNKNOWN' ? undefined : visitDetails.visitRestriction

      const relationshipDescription = visitDetails.visitors.find(
        visitor => visitor.personId === visitDetails.visitContact.visitContactId,
      )?.relationshipDescription

      const mainContact = {
        contactId: visitDetails.visitContact.visitContactId,
        relationshipDescription,
        phoneNumber: visitDetails.visitContact.telephone,
        email: visitDetails.visitContact.email,
        contactName: visitDetails.visitContact.name,
      }

      const visitSessionData: VisitSessionData = {
        allowOverBooking: false,
        prisoner: {
          firstName: convertToTitleCase(prisoner.firstName),
          lastName: convertToTitleCase(prisoner.lastName),
          offenderNo: prisoner.prisonerNumber,
          location: getPrisonerLocation(prisoner),
          alerts: prisoner.prisonerAlerts,
          restrictions: prisoner.prisonerRestrictions,
        },
        prisonId: prisoner.prisonId,
        originalVisitSession: {
          date: visitDetails.startTimestamp.split('T')[0],
          sessionTemplateReference: visitDetails.sessionTemplateReference,
        },
        visitRestriction,
        visitorIds: visitDetails.visitors.map(visitor => visitor.personId),
        visitorSupport: visitDetails.visitorSupport ?? { description: '' },
        mainContact,
        visitReference: visitDetails.reference,
        publicBooker: isPublicBooking(visitDetails.events),
      }

      req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

      const { policyNoticeDaysMin } = req.session.selectedEstablishment

      const numberOfDays = differenceInCalendarDays(new Date(visitDetails.startTimestamp), new Date())

      if (numberOfDays > policyNoticeDaysMin) {
        return res.redirect('/update-a-visit/select-visitors')
      }
      return res.redirect(`/visit/${reference}/confirm-update`)
    }
  }
}
