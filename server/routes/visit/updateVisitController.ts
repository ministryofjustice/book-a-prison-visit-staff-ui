import { RequestHandler } from 'express'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { VisitService } from '../../services'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import { clearSession } from '../visitorUtils'
import { VisitSessionData } from '../../@types/bapv'
import { convertToTitleCase } from '../../utils/utils'
import { getIdsToFlag, getPrisonerLocation, isPublicBooking } from './visitUtils'
import { appendNavStateToPath, extractVisitNavState } from './visitNavigationUtils'

export default class UpdateVisitController {
  public constructor(private readonly visitService: VisitService) {}

  public startVisitUpdate(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const { reference } = req.params
      const { username } = res.locals.user
      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })

      const visitDetails = await this.visitService.getVisitDetailed({ username, reference })
      const { prison, prisoner } = visitDetails

      const prisonerInVisitPrison = prison.prisonId === prisoner.prisonId
      const visitInSelectedEstablishment = prison.prisonId === req.session.selectedEstablishment.prisonId
      if (!prisonerInVisitPrison || !visitInSelectedEstablishment) {
        return res.redirect(appendNavStateToPath(`/visit/${visitDetails.reference}`, navState))
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
        languagePreference: visitDetails.visitContact.languagePreference ?? 'en',
      }

      const startDateTime = parseISO(visitDetails.startTimestamp)
      const endDateTime = parseISO(visitDetails.endTimestamp)
      const date = format(startDateTime, 'yyyy-MM-dd')
      const startTime = format(startDateTime, 'HH:mm')
      const endTime = format(endDateTime, 'HH:mm')

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
          date,
          sessionTemplateReference: visitDetails.sessionTemplateReference,
          startTime,
          endTime,
          visitRestriction,
        },
        visitRestriction,
        visitorIds: visitDetails.visitors.map(visitor => visitor.personId),
        visitorSupport: visitDetails.visitorSupport ?? { description: '' },
        mainContact,
        visitReference: visitDetails.reference,
        publicBooker: isPublicBooking(visitDetails.events),
      }

      const unapprovedVisitorIds = getIdsToFlag({
        notificationType: 'VISITOR_UNAPPROVED_EVENT',
        returnedIdType: 'VISITOR_ID',
        notifications: visitDetails.notifications,
      })
      const unapprovedVisitors = visitDetails.visitors.filter(visitor =>
        unapprovedVisitorIds.includes(visitor.personId.toString()),
      )

      unapprovedVisitors.forEach(visitor => {
        req.flash('messages', {
          variant: 'information',
          title: `${visitor.firstName} ${visitor.lastName} has been unapproved`,
          showTitleAsHeading: true,
          text: 'Complete the update to remove them from the visit.',
        })
      })

      req.session.visitSessionData = Object.assign(req.session.visitSessionData ?? {}, visitSessionData)

      const { policyNoticeDaysMin } = req.session.selectedEstablishment

      const numberOfDays = differenceInCalendarDays(new Date(visitDetails.startTimestamp), new Date())

      if (numberOfDays > policyNoticeDaysMin) {
        return res.redirect('/update-a-visit/select-visitors')
      }
      return res.redirect(appendNavStateToPath(`/visit/${reference}/confirm-update`, navState))
    }
  }
}
