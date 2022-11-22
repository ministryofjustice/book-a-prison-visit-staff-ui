import { Prison, SystemToken } from '../@types/bapv'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'

type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient
type PrisonRegisterApiClientBuilder = (token: string) => PrisonRegisterApiClient

const A_DAY_IN_MS = 24 * 60 * 60 * 1000

export default class SupportedPrisonsService {
  constructor(
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly prisonRegisterApiClientBuilder: PrisonRegisterApiClientBuilder,
    private readonly systemToken: SystemToken,
  ) {}

  private allPrisons: Prison[]

  private lastUpdated = 0

  async getSupportedPrison(prisonId: string, username: string): Promise<Prison> {
    await this.refreshAllPrisons(username)
    return this.allPrisons.find(prison => prison.prisonId === prisonId)
  }

  async getSupportedPrisons(username: string): Promise<Prison[]> {
    await this.refreshAllPrisons(username)
    const prisonIds = await this.getSupportedPrisonIds(username)

    const supportedPrisons = prisonIds
      .map(prisonId => this.allPrisons.find(prison => prison.prisonId === prisonId))
      .filter(prison => prison !== undefined)

    return supportedPrisons
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)
    return visitSchedulerApiClient.getSupportedPrisonIds()
  }

  private async refreshAllPrisons(username: string): Promise<void> {
    if (this.lastUpdated <= Date.now() - A_DAY_IN_MS) {
      const token = await this.systemToken(username)
      const prisonRegisterApiClient = this.prisonRegisterApiClientBuilder(token)
      this.allPrisons = (await prisonRegisterApiClient.getPrisons()).map(prison => {
        return { prisonId: prison.prisonId, prisonName: prison.prisonName }
      })
      this.lastUpdated = Date.now()
    }
  }
}
