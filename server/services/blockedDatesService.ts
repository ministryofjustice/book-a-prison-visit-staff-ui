import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { ExcludeDateDto } from '../data/orchestrationApiTypes'

export default class BlockedDatesService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async blockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.blockVisitDate(prisonId, date, username)
  }

  async unblockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.unblockVisitDate(prisonId, date, username)
  }

  async getFutureBlockedDates(prisonId: string, username: string): Promise<ExcludeDateDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getFutureBlockedDates(prisonId)
  }

  async isBlockedDate(prisonId: string, excludedDate: string, username: string): Promise<boolean> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.isBlockedDate(prisonId, excludedDate)
  }
}
