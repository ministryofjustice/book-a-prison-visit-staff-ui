import { OrchestrationApiClient } from '../data'
import { IgnoreVisitNotificationsDto, Visit, VisitNotifications } from '../data/orchestrationApiTypes'

export default class VisitNotificationsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getNotificationCount(usernameOrPrisonId: string, prisonIdMaybe?: string): Promise<number> {
    const prisonId = prisonIdMaybe ?? usernameOrPrisonId
    return this.orchestrationApiClient.getNotificationCount(prisonId)
  }

  async getVisitNotifications({ prisonId }: { username?: string; prisonId: string }): Promise<VisitNotifications[]> {
    return this.orchestrationApiClient.getVisitNotifications(prisonId)
  }

  async dateHasNotifications(usernameOrPrisonId: string, prisonIdOrDate: string, dateMaybe?: string): Promise<boolean> {
    const prisonId = dateMaybe ? prisonIdOrDate : usernameOrPrisonId
    const date = dateMaybe ?? prisonIdOrDate
    const visitNotifications = await this.orchestrationApiClient.getVisitNotifications(prisonId)

    return visitNotifications.some(visitNotification => visitNotification.visitDate === date)
  }

  async ignoreNotifications({
    reference,
    ignoreVisitNotificationsDto,
  }: {
    username?: string
    reference: string
    ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto
  }): Promise<Visit> {
    return this.orchestrationApiClient.ignoreNotifications(reference, ignoreVisitNotificationsDto)
  }
}
