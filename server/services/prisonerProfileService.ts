import PrisonApiClient from '../data/prisonApiClient'
import { PrisonerProfile, SystemToken } from '../@types/bapv'
import { prisonerDobPretty, properCaseFullName } from '../utils/utils'

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

    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDobPretty(inmateDetail.dateOfBirth)

    return {
      displayName,
      displayDob,
      inmateDetail,
      visitBalances,
    }
  }
}
