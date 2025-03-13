import { RequestHandler } from 'express'
import { AuditService, VisitService } from '../../services'
import { NotificationType, VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'
import { notificationTypeWarnings } from '../../constants/notificationEvents'

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

      const prisonerLocation = getPrisonerLocation(visitDetails)

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

      const showVisitDetails = req.session.selectedEstablishment.prisonId === visitDetails.prison.prisonId

      await this.auditService.viewedVisitDetails({
        visitReference: reference,
        prisonerId: visitDetails.prisoner.prisonerNumber,
        prisonId: visitDetails.prison.prisonId,
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
        visitDetails,
      })
    }
  }
}

// TODO remove/refactor
function getPrisonerLocation(visitDetails: VisitBookingDetailsDto) {
  if (visitDetails.prisoner.prisonId === 'OUT') {
    return visitDetails.prisoner.locationDescription
  }

  if (visitDetails.prisoner.prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${visitDetails.prisoner.cellLocation}, ${visitDetails.prisoner.prisonName}`
}
