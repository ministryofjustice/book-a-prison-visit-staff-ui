import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonExcludeDateDto } from '../data/orchestrationApiTypes'

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

  async getFutureExcludeDates(prisonId: string, username: string): Promise<PrisonExcludeDateDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getFutureExcludeDates(prisonId)
  }
}
