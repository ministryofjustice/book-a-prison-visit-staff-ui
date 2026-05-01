import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import {
  getAvailableVisitActions,
  getIdsToFlag,
  getPrisonerLocation,
  getVisitAlerts,
  getHideAlertsInset,
} from './visitUtils'
import visitEventsTimelineBuilder from './visitEventsTimelineBuilder'
import { VisitBookingDetails } from '../../data/orchestrationApiTypes'

export default class VisitDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const { reference } = req.params
      const { selectedEstablishment } = req.session
      const { username } = res.locals.user

      const visitDetails = await this.visitService.getVisitDetailed({ username, reference })
      const { prison, prisoner } = visitDetails

      await this.auditService.viewedVisitDetails({
        visitReference: reference,
        prisonerId: prisoner.prisonerNumber,
        prisonId: prison.prisonId,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      if (selectedEstablishment.prisonId !== prison.prisonId) {
        return res.render('pages/visit/visitDetailsWrongEstablishment', { prison, reference, selectedEstablishment })
      }

      const hideAlertsInset = getHideAlertsInset({
        prisonerNumber: visitDetails.prisoner.prisonerNumber,
        startTimestamp: visitDetails.startTimestamp,
        visitPrisonId: visitDetails.prison.prisonId,
        prisonerPrisonId: visitDetails.prisoner.prisonId,
        inOutStatus: visitDetails.prisoner.inOutStatus,
      })

      const availableVisitActions = getAvailableVisitActions({
        visitStatus: visitDetails.visitStatus,
        visitSubStatus: visitDetails.visitSubStatus,
        startTimestamp: visitDetails.startTimestamp,
        notifications: visitDetails.notifications,
      })

      const messages = getVisitAlerts(visitDetails)

      const flaggedVisitorRestrictionIds = getIdsToFlag({
        notificationType: 'VISITOR_RESTRICTION',
        returnedIdType: 'VISITOR_RESTRICTION_ID',
        notifications: visitDetails.notifications,
      })
      const unapprovedVisitorIds = getIdsToFlag({
        notificationType: 'VISITOR_UNAPPROVED_EVENT',
        returnedIdType: 'VISITOR_ID',
        notifications: visitDetails.notifications,
      })

      const eventsTimeline = visitEventsTimelineBuilder({
        events: visitDetails.events,
        visitNotes: visitDetails.visitNotes,
      })

      const fromPage = typeof req.query?.from === 'string' ? req.query.from : null
      const fromPageQuery = typeof req.query?.query === 'string' ? req.query.query : null

      const prisonerDpsAlertsUrl = getDpsPrisonerAlertsUrl(visitDetails.prisoner.prisonerNumber)
      const prisonerLocation = getPrisonerLocation(prisoner)

      return res.render('pages/visit/visitDetails', {
        pageHeaderTitle: this.getPageHeaderTitle(visitDetails.visitSubStatus),
        hideAlertsInset,
        availableVisitActions,
        eventsTimeline,
        fromPage,
        fromPageQuery,
        messages,
        prisonerDpsAlertsUrl,
        prisonerLocation,
        visitDetails,
        flaggedVisitorRestrictionIds,
        unapprovedVisitorIds,
        prisonerId: prisoner.prisonerNumber,
      })
    }
  }

  private getPageHeaderTitle(visitSubStatus: VisitBookingDetails['visitSubStatus']): string {
    const requestTitleSubStatuses: VisitBookingDetails['visitSubStatus'][] = [
      'REQUESTED',
      'REJECTED',
      'AUTO_REJECTED',
      'WITHDRAWN',
    ]
    return requestTitleSubStatuses.includes(visitSubStatus) ? 'Visit request details' : 'Visit booking details'
  }
}
