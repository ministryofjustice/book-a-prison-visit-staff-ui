import { HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, RestClientBuilder } from '../data'
import { PrisonName } from '../data/prisonRegisterApiTypes'

const A_DAY_IN_MS = 24 * 60 * 60 * 1000

export default class SupportedPrisonsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonRegisterApiClientFactory: RestClientBuilder<PrisonRegisterApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  private prisonNames: PrisonName[]

  private lastUpdated = 0

  async getSupportedPrisons(username: string): Promise<Record<string, string>> {
    await this.refreshPrisonNames(username)
    const supportedPrisonIds = await this.getSupportedPrisonIds(username)

    const supportedPrisons: Record<string, string> = {}

    supportedPrisonIds.forEach(prisonId => {
      const supportedPrison = this.prisonNames.find(prison => prison.prisonId === prisonId)
      if (supportedPrison) {
        supportedPrisons[supportedPrison.prisonId] = supportedPrison.prisonName
      }
    })

    return supportedPrisons
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getSupportedPrisonIds()
  }

  async getPrisonConfig(
    username: string,
    prisonCode: string,
  ): Promise<{ maxTotalVisitors: number; policyNoticeDaysMin: number }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const { policyNoticeDaysMin, maxTotalVisitors } = await orchestrationApiClient.getPrison(prisonCode)
    return { maxTotalVisitors, policyNoticeDaysMin }
  }

  private async refreshPrisonNames(username: string): Promise<void> {
    if (this.lastUpdated <= Date.now() - A_DAY_IN_MS) {
      const token = await this.hmppsAuthClient.getSystemClientToken(username)
      const prisonRegisterApiClient = this.prisonRegisterApiClientFactory(token)
      this.prisonNames = (await prisonRegisterApiClient.getPrisonNames()).map(prison => {
        return { prisonId: prison.prisonId, prisonName: prison.prisonName }
      })
      this.lastUpdated = Date.now()
    }
  }
}
