import { OrchestrationApiClient } from '../data'
import { IgnoreVisitNotificationsDto, Visit, VisitNotifications } from '../data/orchestrationApiTypes'

export default class VisitNotificationsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getNotificationCount(username: string, prisonId: string): Promise<number> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getNotificationCount(prisonId)
  }

  async getVisitNotifications({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<VisitNotifications[]> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient
    return orchestrationApiClient.getVisitNotifications(prisonId)
  }

  async dateHasNotifications(username: string, prisonId: string, date: string): Promise<boolean> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient

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
    void username
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto)
  }
}
