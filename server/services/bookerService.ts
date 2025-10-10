import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { BookerSearchResultsDto } from '../data/orchestrationApiTypes'

export default class BookerService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getBookersByEmail(username: string, email: string): Promise<BookerSearchResultsDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getBookersByEmail(email)
  }
}
