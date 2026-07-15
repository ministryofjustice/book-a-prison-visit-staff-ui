import { Prison } from '../@types/bapv'
import { OrchestrationApiClient } from '../data'

export default class SupportedPrisonsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getActiveAgencies(): Promise<string[]> {
    return this.getSupportedPrisonIds(undefined)
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient
    return orchestrationApiClient.getSupportedPrisonIds()
  }

  async isSupportedPrison(username: string, prisonId: string): Promise<boolean> {
    return (await this.getSupportedPrisonIds(username)).includes(prisonId)
  }

  async getPrison(username: string, prisonId: string): Promise<Prison> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient
    return orchestrationApiClient.getPrison(prisonId)
  }
}
