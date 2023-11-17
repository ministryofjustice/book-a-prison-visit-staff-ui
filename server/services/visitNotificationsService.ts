import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { NotificationCount } from '../data/orchestrationApiTypes'

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
}
