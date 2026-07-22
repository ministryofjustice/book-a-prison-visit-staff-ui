import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../../services'
import { getDpsPrisonerAlertsUrl } from '../../../utils/utils'
import { VisitReferenceParams } from '../../../@types/requestParameterTypes'
import { getIdsToFlag, getPrisonerLocation } from '../visitUtils'
import {
  appendNavStateToPath,
  extractVisitNavState,
  getVisitDetailsBackLink,
  type VisitNavState,
} from '../visitNavigationUtils'
import buildVisitEventsTimeline from './buildVisitEventsTimeline'
import getAlertsHiddenMessages from './getAlertsHiddenMessages'
import getAvailableVisitActions from './getAvailableVisitActions'
import getVisitAlerts from './getVisitAlerts'
import { VisitBookingDetails } from '../../../data/orchestrationApiTypes'

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
        return res.render('pages/visit/details/visitDetailsWrongEstablishment', {
          prison,
          reference,
          selectedEstablishment,
        })
      }

      const hideAlertsInset = getAlertsHiddenMessages({
        skipAlertsAndRestrictionReason: visitDetails.skipAlertsAndRestrictionReason,
        prisonerNumber: visitDetails.prisoner.prisonerNumber,
      })

      const availableVisitActions = getAvailableVisitActions({
        visitStatus: visitDetails.visitStatus,
        visitSubStatus: visitDetails.visitSubStatus,
        startTimestamp: visitDetails.startTimestamp,
        notifications: visitDetails.notifications,
      })

      const messages = [...req.flash('messages'), ...getVisitAlerts(visitDetails)]

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
      const flaggedAlertCreatedIds = getIdsToFlag({
        notificationType: 'PRISONER_ALERT_CREATED_EVENT',
        returnedIdType: 'ALERT_UUID',
        notifications: visitDetails.notifications,
      })
      const flaggedAlertUpdatedIds = getIdsToFlag({
        notificationType: 'PRISONER_ALERT_UPDATED_EVENT',
        returnedIdType: 'ALERT_UUID',
        notifications: visitDetails.notifications,
      })

      const eventsTimeline = buildVisitEventsTimeline({
        events: visitDetails.events,
        visitNotes: visitDetails.visitNotes,
      })

      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })
      const { backLinkHref } = getVisitDetailsBackLink({
        navState,
        prisonerNumber: prisoner.prisonerNumber,
      })
      const cancelHref = appendNavStateToPath(`/visit/${reference}/cancel`, navState)
      const clearNotificationsHref = appendNavStateToPath(`/visit/${reference}/clear-notifications`, navState)
      const startUpdateAction = appendNavStateToPath(`/visit/${reference}/update`, navState)
      const { processRequestApproveAction, processRequestRejectAction } = this.getProcessRequestActions(
        reference,
        navState,
        navState.fromPage === 'prisoner' ? prisoner.prisonerNumber : undefined,
      )

      const prisonerDpsAlertsUrl = getDpsPrisonerAlertsUrl(visitDetails.prisoner.prisonerNumber)
      const prisonerLocation = getPrisonerLocation(prisoner)

      return res.render('pages/visit/details/visitDetails', {
        pageHeaderTitle: this.getPageHeaderTitle(visitDetails.visitSubStatus),
        backLinkHref,
        hideAlertsInset,
        availableVisitActions,
        eventsTimeline,
        cancelHref,
        clearNotificationsHref,
        startUpdateAction,
        processRequestApproveAction,
        processRequestRejectAction,
        messages,
        prisonerDpsAlertsUrl,
        prisonerLocation,
        visitDetails,
        flaggedVisitorRestrictionIds,
        unapprovedVisitorIds,
        flaggedAlertCreatedIds,
        flaggedAlertUpdatedIds,
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

  private getProcessRequestActions(
    reference: string,
    navState: VisitNavState,
    prisonerNumber?: string,
  ): {
    processRequestApproveAction: string
    processRequestRejectAction: string
  } {
    const approveAction = appendNavStateToPath(`/visit/${reference}/request/approve`, navState)
    const rejectAction = appendNavStateToPath(`/visit/${reference}/request/reject/reason`, navState)

    if (prisonerNumber) {
      const separator = (url: string) => (url.includes('?') ? '&' : '?')
      return {
        processRequestApproveAction: `${approveAction}${separator(approveAction)}prisonerId=${prisonerNumber}`,
        processRequestRejectAction: `${rejectAction}${separator(rejectAction)}prisonerId=${prisonerNumber}`,
      }
    }

    return {
      processRequestApproveAction: approveAction,
      processRequestRejectAction: rejectAction,
    }
  }
}
