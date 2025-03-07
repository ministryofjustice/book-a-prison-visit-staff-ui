import { RequestHandler } from 'express'
import { AuditService, PrisonerSearchService, SupportedPrisonsService, VisitService } from '../../services'
import eventAuditTypes from '../../constants/eventAuditTypes'
import { Prisoner } from '../../data/prisonerOffenderSearchTypes'
import { NotificationType } from '../../data/orchestrationApiTypes'
import { notificationTypes, notificationTypeWarnings } from '../../constants/notificationEvents'
import { requestMethodDescriptions } from '../../constants/requestMethods'

export default class VisitDetailsController {
  private readonly A_DAY_IN_MS = 24 * 60 * 60 * 1000

  private readonly CANCELLATION_LIMIT_DAYS = 28

  private readonly NO_UPDATE_NOTIFICATION_TYPES: NotificationType[] = [
    'PRISONER_RECEIVED_EVENT',
    'PRISONER_RELEASED_EVENT',
  ]

  public constructor(
    private readonly auditService: AuditService,
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly supportedPrisonsService: SupportedPrisonsService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.params

      const fromPage = typeof req.query?.from === 'string' ? req.query.from : null
      const fromPageQuery = typeof req.query?.query === 'string' ? req.query.query : null
      const { username } = res.locals.user

      const visitDetails = await this.visitService.getVisitDetailed({ username, reference })

      const { visitHistoryDetails, visitors, notifications, additionalSupport } =
        await this.visitService.getFullVisitDetails({
          reference,
          username,
        })
      const { visit } = visitHistoryDetails

      if (visit.prisonId !== req.session.selectedEstablishment.prisonId) {
        const visitPrison = await this.supportedPrisonsService.getPrison(username, visit.prisonId)

        return res.render('pages/visit/visitDetails', {
          visit: { reference: visit.reference },
          visitPrisonName: visitPrison.prisonName,
        })
      }

      const [prisoner, supportedPrisonIds] = await Promise.all([
        this.prisonerSearchService.getPrisonerById(visit.prisonerId, username),
        this.supportedPrisonsService.getSupportedPrisonIds(username),
      ])
      const prisonerLocation = getPrisonerLocation(supportedPrisonIds, prisoner)

      await this.auditService.viewedVisitDetails({
        visitReference: reference,
        prisonerId: visit.prisonerId,
        prisonId: visit.prisonId,
        username,
        operationId: res.locals.appInsightsOperationId,
      })

      const nowTimestamp = new Date()
      const visitStartTimestamp = new Date(visit.startTimestamp)
      const chosenFutureInterval = new Date(
        visitStartTimestamp.getTime() + this.A_DAY_IN_MS * this.CANCELLATION_LIMIT_DAYS,
      )

      const showUpdateButton =
        nowTimestamp < visitStartTimestamp &&
        !notifications.some(notification => this.NO_UPDATE_NOTIFICATION_TYPES.includes(notification))
      const showCancelButton = nowTimestamp < chosenFutureInterval

      const filteredNotifications = notifications.filter(
        notification => notification !== 'PRISON_VISITS_BLOCKED_FOR_DATE',
      )
      const showDoNotChangeButton = filteredNotifications.length > 0

      const eventsTimeline = this.visitService.getVisitEventsTimeline(visitHistoryDetails.eventsAudit, visit)

      return res.render('pages/visit/visitDetails', {
        prisoner,
        prisonerLocation,
        visit,
        visitors,
        notifications,
        notificationTypeWarnings,
        additionalSupport,
        fromPage,
        fromPageQuery,
        showUpdateButton,
        showCancelButton,
        showDoNotChangeButton,
        requestMethodDescriptions,
        eventAuditTypes,
        notificationTypes,
        eventsTimeline,
        visitDetails,
      })
    }
  }
}

// TODO duplicated from visit.ts - need to review
function getPrisonerLocation(supportedPrisonIds: string[], prisoner: Prisoner) {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }
  return supportedPrisonIds.includes(prisoner.prisonId) ? `${prisoner.cellLocation}, ${prisoner.prisonName}` : 'Unknown'
}
