import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { SupportType } from '../data/orchestrationApiTypes'

export default class AdditionalSupportService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getAvailableSupportOptions(username: string): Promise<SupportType[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getAvailableSupportOptions()
  }
}
