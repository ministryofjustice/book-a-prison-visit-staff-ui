import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { VisitRequestsCountDto } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVisitRequestCount(username: string, prisonId: string): Promise<VisitRequestsCountDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
