import { Prison } from '../@types/bapv'
import { HmppsAuthClient, PrisonRegisterApiClient, RestClientBuilder, VisitSchedulerApiClient } from '../data'

const A_DAY_IN_MS = 24 * 60 * 60 * 1000

export default class SupportedPrisonsService {
  constructor(
    private readonly visitSchedulerApiClientFactory: RestClientBuilder<VisitSchedulerApiClient>,
    private readonly prisonRegisterApiClientFactory: RestClientBuilder<PrisonRegisterApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  private allPrisons: Prison[]

  private lastUpdated = 0

  async getSupportedPrisons(username: string): Promise<Record<string, string>> {
    await this.refreshAllPrisons(username)
    const supportedPrisonIds = await this.getSupportedPrisonIds(username)

    const supportedPrisons = {}

    supportedPrisonIds.forEach(prisonId => {
      const supportedPrison = this.allPrisons.find(prison => prison.prisonId === prisonId)
      if (supportedPrison) {
        supportedPrisons[supportedPrison.prisonId] = supportedPrison.prisonName
      }
    })

    return supportedPrisons
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    return visitSchedulerApiClient.getSupportedPrisonIds()
  }

  private async refreshAllPrisons(username: string): Promise<void> {
    if (this.lastUpdated <= Date.now() - A_DAY_IN_MS) {
      const token = await this.hmppsAuthClient.getSystemClientToken(username)
      const prisonRegisterApiClient = this.prisonRegisterApiClientFactory(token)
      this.allPrisons = (await prisonRegisterApiClient.getPrisons()).map(prison => {
        return { prisonId: prison.prisonId, prisonName: prison.prisonName }
      })
      this.lastUpdated = Date.now()
    }
  }
}
