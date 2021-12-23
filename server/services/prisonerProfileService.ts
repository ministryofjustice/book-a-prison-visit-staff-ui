import PrisonApiClient from '../data/prisonApiClient'
import { PrisonerProfile, SystemToken } from '../@types/bapv'

type PrisonApiClientBuilder = (token: string) => PrisonApiClient

export default class PrisonerProfileService {
  constructor(
    private readonly prisonApiClientBuilder: PrisonApiClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  async getProfile(offenderNo: string, username: string): Promise<PrisonerProfile> {
    const token = await this.systemToken(username)
    const prisonerSearchClient = this.prisonApiClientBuilder(token)

    const [inmateDetail, visitBalances] = await Promise.all([
      prisonerSearchClient.getOffender(offenderNo),
      prisonerSearchClient.getVisitBalances(offenderNo),
    ])

    return {
      inmateDetail,
      visitBalances,
    }
  }
}
