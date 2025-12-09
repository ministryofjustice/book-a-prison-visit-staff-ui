import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { IgnoreVisitNotificationsDto, Visit, VisitNotifications } from '../data/orchestrationApiTypes'

export default class VisitNotificationsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getNotificationCount(username: string, prisonId: string): Promise<number> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getNotificationCount(prisonId)
  }

  async getVisitNotifications({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<VisitNotifications[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getVisitNotifications(prisonId)
  }

  async dateHasNotifications(username: string, prisonId: string, date: string): Promise<boolean> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitNotifications = await orchestrationApiClient.getVisitNotifications(prisonId)

    return visitNotifications.some(visitNotification => visitNotification.visitDate === date)
  }

  async ignoreNotifications({
    username,
    reference,
    ignoreVisitNotificationsDto,
  }: {
    username: string
    reference: string
    ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto)
  }
}
