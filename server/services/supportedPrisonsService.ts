import { Prison, SystemToken } from '../@types/bapv'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'

type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient
type PrisonRegisterApiClientBuilder = (token: string) => PrisonRegisterApiClient

export default class SupportedPrisonsService {
  constructor(
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly prisonRegisterApiClientBuilder: PrisonRegisterApiClientBuilder,
    private readonly systemToken: SystemToken,
  ) {}

  async getSupportedPrison(prisonId: string, username: string): Promise<Prison> {
    const allPrisons = await this.getAllPrisons(username)
    return allPrisons.find(prison => prison.prisonId === prisonId)
  }

  async getSupportedPrisons(username: string): Promise<Prison[]> {
    const prisonIds = await this.getSupportedPrisonIds(username)
    const allPrisons = await this.getAllPrisons(username)

    const supportedPrisons = prisonIds
      .map(prisonId => allPrisons.find(prison => prison.prisonId === prisonId))
      .filter(prison => prison !== undefined)

    return supportedPrisons
  }

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)
    return visitSchedulerApiClient.getSupportedPrisonIds()
  }

  private async getAllPrisons(username: string): Promise<Prison[]> {
    const token = await this.systemToken(username)
    const prisonRegisterApiClient = this.prisonRegisterApiClientBuilder(token)
    return prisonRegisterApiClient.getPrisons()
  }
}
