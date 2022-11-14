import { Prison, SystemToken } from '../@types/bapv'
import prisons from '../constants/prisons'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'

type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient

export default class SupportedPrisonsService {
  constructor(
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly systemToken: SystemToken,
  ) {}

  async getSupportedPrison(prisonId: string): Promise<Prison> {
    return this.getAllPrisons().find(prison => prison.prisonId === prisonId)
  }

  async getSupportedPrisons(username: string): Promise<Prison[]> {
    const prisonIds = await this.getSupportedPrisonIds(username)
    const allPrisons = this.getAllPrisons()

    const supportedPrisons = prisonIds
      .map(prisonId => allPrisons.find(prison => prison.prisonId === prisonId))
      .filter(prison => prison !== undefined)

    return supportedPrisons
  }

  private async getSupportedPrisonIds(username: string): Promise<string[]> {
    const token = await this.systemToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)
    return visitSchedulerApiClient.getSupportedPrisonIds()
  }

  // @TODO look up from static file to be replaced with call to Prison Register API
  private getAllPrisons(): Prison[] {
    return prisons
  }
}
