import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonExcludeDateDto } from '../data/orchestrationApiTypes'

export default class BlockedDatesService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getFutureExcludeDates(prisonCode: string, username: string): Promise<PrisonExcludeDateDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getFutureExcludeDates(prisonCode)
  }
}
