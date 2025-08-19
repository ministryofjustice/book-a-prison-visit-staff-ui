import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'
import {
  getAvailableVisitActions,
  getPrisonerLocation,
  getVisitAlerts,
  getVisitorRestrictionIdsToFlag,
} from './visitUtils'
import visitEventsTimelineBuilder from './visitEventsTimelineBuilder'

export default class VisitDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
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

      const messages = getVisitAlerts(visitDetails)

      const availableVisitActions = getAvailableVisitActions({
        visitStatus: visitDetails.visitStatus,
        visitSubStatus: visitDetails.visitSubStatus,
        startTimestamp: visitDetails.startTimestamp,
        notifications: visitDetails.notifications,
      })

      const flaggedVisitorRestrictionIds = getVisitorRestrictionIdsToFlag(visitDetails.notifications)

      const eventsTimeline = visitEventsTimelineBuilder({
        events: visitDetails.events,
        visitNotes: visitDetails.visitNotes,
      })

      const fromPage = typeof req.query?.from === 'string' ? req.query.from : null
      const fromPageQuery = typeof req.query?.query === 'string' ? req.query.query : null

      const prisonerDpsAlertsUrl = getDpsPrisonerAlertsUrl(visitDetails.prisoner.prisonerNumber)
      const prisonerLocation = getPrisonerLocation(prisoner)

      return res.render('pages/visit/visitDetails', {
        availableVisitActions,
        eventsTimeline,
        fromPage,
        fromPageQuery,
        messages,
        prisonerDpsAlertsUrl,
        prisonerLocation,
        visitDetails,
        flaggedVisitorRestrictionIds,
        prisonerId: prisoner.prisonerNumber,
      })
    }
  }
}
