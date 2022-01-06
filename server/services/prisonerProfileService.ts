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

    const inmateDetail = await prisonerSearchClient.getOffender(offenderNo)
    let visitBalances = null
    if (inmateDetail.legalStatus !== 'REMAND') {
      visitBalances = await prisonerSearchClient.getVisitBalances(offenderNo)
    }

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
