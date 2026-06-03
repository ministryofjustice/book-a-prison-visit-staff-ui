import { HmppsAuthClient, IncentivesApiClient, RestClientBuilder } from '../data'
import { PrisonIncentivesLevels } from '../data/incentivesApiTypes'

export type VisitAllowances = {
  basic: VisitAllowanceType
  standard: VisitAllowanceType
  enhanced: VisitAllowanceType
}
export type VisitAllowanceType = {
  vo: number
  pvo: number
}

export default class VisitAllowanceService {
  constructor(
    private readonly incentivesApiClientFactory: RestClientBuilder<IncentivesApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getIncentivesLevels({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<PrisonIncentivesLevels> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const incentivesApiClient = this.incentivesApiClientFactory(token)

    return incentivesApiClient.getPrisonIncentiveLevels(prisonId)
  }
}
