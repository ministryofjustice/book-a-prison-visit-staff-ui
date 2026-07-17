import { Prison } from '../@types/bapv'
import { OrchestrationApiClient } from '../data'

export default class SupportedPrisonsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getActiveAgencies(): Promise<string[]> {
    return this.getSupportedPrisonIds()
  }

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.orchestrationApiClient.getSupportedPrisonIds()
  }

  async isSupportedPrison(usernameOrPrisonId: string, prisonIdMaybe?: string): Promise<boolean> {
    const prisonId = prisonIdMaybe ?? usernameOrPrisonId
    return (await this.getSupportedPrisonIds()).includes(prisonId)
  }

  async getPrison(usernameOrPrisonId: string, prisonIdMaybe?: string): Promise<Prison> {
    const prisonId = prisonIdMaybe ?? usernameOrPrisonId
    return this.orchestrationApiClient.getPrison(prisonId)
  }
}
