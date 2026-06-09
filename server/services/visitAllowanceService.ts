import { HmppsAuthClient, IncentivesApiClient, RestClientBuilder } from '../data'
import { PrisonIncentiveLevel } from '../data/incentivesApiTypes'

export default class VisitAllowanceService {
  constructor(
    private readonly incentivesApiClientFactory: RestClientBuilder<IncentivesApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getPrisonIncentiveLevels({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<PrisonIncentiveLevel[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const incentivesApiClient = this.incentivesApiClientFactory(token)

    return incentivesApiClient.getPrisonIncentiveLevels(prisonId)
  }
}
