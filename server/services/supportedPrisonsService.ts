import { Prison } from '../@types/bapv'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'

export default class SupportedPrisonsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getActiveAgencies(): Promise<string[]> {
    return this.getSupportedPrisonIds(undefined)
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getSupportedPrisonIds()
  }

  async isSupportedPrison(username: string, prisonId: string): Promise<boolean> {
    return (await this.getSupportedPrisonIds(username)).includes(prisonId)
  }

  async getPrison(username: string, prisonId: string): Promise<Prison> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getPrison(prisonId)
  }
}
