import { VisitsReviewListItem } from '../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { NotificationCount } from '../data/orchestrationApiTypes'
import { prisonerDateTimePretty } from '../utils/utils'

export default class VisitNotificationsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getNotificationCount(username: string, prisonId: string): Promise<NotificationCount> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getNotificationCount(prisonId)
  }

  async getVisitsReviewList(username: string, prisonId: string): Promise<VisitsReviewListItem[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const notificationGroups = await orchestrationApiClient.getNotificationGroups(prisonId)

    return notificationGroups.map(notification => {
      const bookedByNames = notification.affectedVisits.map(visit => visit.bookedByName)

      const prisonerNumbers =
        notification.type === 'NON_ASSOCIATION_EVENT'
          ? notification.affectedVisits.map(visit => visit.prisonerNumber)
          : [notification.affectedVisits[0].prisonerNumber]

      const visitDates =
        notification.type === 'NON_ASSOCIATION_EVENT'
          ? [prisonerDateTimePretty(notification.affectedVisits[0].visitDate)]
          : notification.affectedVisits.map(visit => prisonerDateTimePretty(visit.visitDate))

      return {
        bookedByNames,
        prisonerNumbers,
        reference: notification.reference,
        type: notification.type,
        visitDates,
      }
    })
  }
}
