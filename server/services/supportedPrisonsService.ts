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

  async isSupportedPrison(prisonId: string): Promise<boolean> {
    return (await this.getSupportedPrisonIds()).includes(prisonId)
  }

  async getPrison(prisonId: string): Promise<Prison> {
    return this.orchestrationApiClient.getPrison(prisonId)
  }
}
