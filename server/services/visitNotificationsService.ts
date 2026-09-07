import { OrchestrationApiClient } from '../data'
import { IgnoreVisitNotificationsDto, Visit, VisitNotifications } from '../data/orchestrationApiTypes'

export default class VisitNotificationsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getNotificationCount(prisonId: string): Promise<number> {
    return this.orchestrationApiClient.getNotificationCount(prisonId)
  }

  async getVisitNotifications({ prisonId }: { prisonId: string }): Promise<VisitNotifications[]> {
    return this.orchestrationApiClient.getVisitNotifications(prisonId)
  }

  async dateHasNotifications(prisonId: string, date: string): Promise<boolean> {
    const visitNotifications = await this.orchestrationApiClient.getVisitNotifications(prisonId)

    return visitNotifications.some(visitNotification => visitNotification.visitDate === date)
  }

  async ignoreNotifications({
    reference,
    ignoreVisitNotificationsDto,
  }: {
    reference: string
    ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto
  }): Promise<Visit> {
    return this.orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto)
  }
}
