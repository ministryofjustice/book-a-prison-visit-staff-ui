import { RequestHandler } from 'express'
import { differenceInCalendarDays } from 'date-fns'
import { VisitService } from '../../services'
import { clearSession } from '../visitorUtils'
import { VisitSessionData, VisitSlot } from '../../@types/bapv'
import { convertToTitleCase } from '../../utils/utils'
import { getPrisonerLocation } from './visitUtils'

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

      const visitSlot: VisitSlot = {
        id: '',
        sessionTemplateReference: visitDetails.sessionTemplateReference,
        prisonId: prison.prisonId,
        startTimestamp: visitDetails.startTimestamp,
        endTimestamp: visitDetails.endTimestamp,
        availableTables: 0,
        capacity: undefined,
        visitRoom: visitDetails.visitRoom,
        visitRestriction,
      }

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
        visitSlot,
        originalVisitSlot: visitSlot,
        visitRestriction,
        visitorIds: visitDetails.visitors.map(visitor => visitor.personId),
        visitorSupport: visitDetails.visitorSupport ?? { description: '' },
        mainContact,
        visitReference: visitDetails.reference,
      }

      req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

      const { policyNoticeDaysMin } = req.session.selectedEstablishment

      const numberOfDays = differenceInCalendarDays(new Date(visitDetails.startTimestamp), new Date())

      if (numberOfDays >= policyNoticeDaysMin) {
        return res.redirect('/update-a-visit/select-visitors')
      }
      return res.redirect(`/visit/${reference}/confirm-update`)
    }
  }
}
