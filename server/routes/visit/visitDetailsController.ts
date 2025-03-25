import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { NotificationType } from '../../data/orchestrationApiTypes'
import { notificationTypeWarnings } from '../../constants/notificationEvents'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'
import { getPrisonerLocation } from './visitUtils'

export default class VisitDetailsController {
  private readonly A_DAY_IN_MS = 24 * 60 * 60 * 1000

  private readonly CANCELLATION_LIMIT_DAYS = 28

  private readonly NO_UPDATE_NOTIFICATION_TYPES: NotificationType[] = [
    'PRISONER_RECEIVED_EVENT',
    'PRISONER_RELEASED_EVENT',
  ]

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

      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visitDetails.startTimestamp)
      const chosenFutureInterval = new Date(
        visitStartTimestamp.getTime() + this.A_DAY_IN_MS * this.CANCELLATION_LIMIT_DAYS,
      )

      const showUpdateButton =
        nowTimestamp < visitStartTimestamp &&
        !visitDetails.notifications.some(notification => this.NO_UPDATE_NOTIFICATION_TYPES.includes(notification.type))
      const showCancelButton = nowTimestamp < chosenFutureInterval

      const filteredNotifications = visitDetails.notifications.filter(
        notification => notification.type !== 'PRISON_VISITS_BLOCKED_FOR_DATE',
      )
      const showDoNotChangeButton = filteredNotifications.length > 0

      const eventsTimeline = this.visitService.getVisitEventsTimeline({
        events: visitDetails.events,
        visitStatus: visitDetails.visitStatus,
        visitNotes: visitDetails.visitNotes,
      })

      const showVisitDetails = req.session.selectedEstablishment.prisonId === prison.prisonId

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

        showUpdateButton,
        showCancelButton,
        showDoNotChangeButton,

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
