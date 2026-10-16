import { Prison } from '../@types/bapv'
import config from '../config'
import { OrchestrationApiClient } from '../data'
import type { DataCache } from '../data/dataCache/dataCache'

export default class SupportedPrisonsService {
  private readonly prisonCacheConfig = config.dataCache.prison

  constructor(
    private readonly orchestrationApiClient: OrchestrationApiClient,
    private readonly dataCache: DataCache,
  ) {}

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
    const cachedPrison = await this.dataCache.get<Prison>(`${this.prisonCacheConfig.key}:${prisonId}`)

    if (cachedPrison) {
      return cachedPrison
    }

    const prison = await this.orchestrationApiClient.getPrison(prisonId)

    await this.dataCache.set<Prison>(
      `${this.prisonCacheConfig.key}:${prisonId}`,
      prison,
      this.prisonCacheConfig.ttlSecs,
    )
    return prison
  }
}
