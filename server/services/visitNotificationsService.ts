import { OrchestrationApiClient } from '../data'
import { IgnoreVisitNotificationsDto, Visit, VisitNotifications } from '../data/orchestrationApiTypes'

export default class VisitNotificationsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getNotificationCount(username: string, prisonId: string): Promise<number> {
    return this.orchestrationApiClient.getNotificationCount(prisonId, username)
  }

  async getVisitNotifications({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<VisitNotifications[]> {
    return this.orchestrationApiClient.getVisitNotifications(prisonId, username)
  }

  async dateHasNotifications(username: string, prisonId: string, date: string): Promise<boolean> {
    const visitNotifications = await this.orchestrationApiClient.getVisitNotifications(prisonId, username)

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
    return this.orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto, username)
  }
}
