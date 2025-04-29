import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { notificationTypeWarnings } from '../../constants/notificationEvents'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'
import { getAvailableVisitActions, getPrisonerLocation } from './visitUtils'

export default class VisitDetailsController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params

      const fromPage = typeof req.query?.from === 'string' ? req.query.from : null
      const fromPageQuery = typeof req.query?.query === 'string' ? req.query.query : null
      const { username } = res.locals.user

      const visitDetails = await this.visitService.getVisitDetailed({ username, reference })
      const { prison, prisoner } = visitDetails

      const prisonerLocation = getPrisonerLocation(prisoner)

      const eventsTimeline = this.visitService.getVisitEventsTimeline({
        events: visitDetails.events,
        visitStatus: visitDetails.visitStatus,
        visitNotes: visitDetails.visitNotes,
      })

      // TODO leave early and render a different template?
      const showVisitDetails = req.session.selectedEstablishment.prisonId === prison.prisonId

      const availableVisitActions = getAvailableVisitActions({
        visitStatus: visitDetails.visitStatus,
        startTimestamp: visitDetails.startTimestamp,
        notifications: visitDetails.notifications,
      })

      await this.auditService.viewedVisitDetails({
        visitReference: reference,
        prisonerId: prisoner.prisonerNumber,
        prisonId: prison.prisonId,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      return res.render('pages/visit/visitDetails', {
        fromPage,
        fromPageQuery,

        availableVisitActions,

        notificationTypeWarnings,

        eventsTimeline,

        prisonerLocation,
        showVisitDetails,
        prisonerDpsAlertsUrl: getDpsPrisonerAlertsUrl(visitDetails.prisoner.prisonerNumber),
        visitDetails,
      })
    }
  }
}
