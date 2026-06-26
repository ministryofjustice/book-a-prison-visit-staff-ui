import { PrisonRemandConfig } from '../@types/bapv'
import { HmppsAuthClient, IncentivesApiClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonIncentiveLevel } from '../data/incentivesApiTypes'
import { VisitSchedulerUpdatePrisonDto } from '../data/orchestrationApiTypes'

export default class VisitAllowanceService {
  constructor(
    private readonly incentivesApiClientFactory: RestClientBuilder<IncentivesApiClient>,
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
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

  async getRemandConfig({ username, prisonId }: { username: string; prisonId: string }): Promise<PrisonRemandConfig> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const prison = await orchestrationApiClient.getPrison(prisonId)

    return { weekStartDay: prison.weekStartDay, remandVisitLimitPerWeek: prison.remandVisitLimitPerWeek }
  }

  async updateRemandConfig({
    username,
    prisonId,
    weekStartDay,
    remandVisitLimitPerWeek,
  }: {
    username: string
    prisonId: string
    weekStartDay: VisitSchedulerUpdatePrisonDto['weekStartDay']
    remandVisitLimitPerWeek: VisitSchedulerUpdatePrisonDto['remandVisitLimitPerWeek']
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitSchedulerUpdatePrisonDto = { weekStartDay, remandVisitLimitPerWeek }

    await orchestrationApiClient.updatePrisonConfig({
      prisonId,
      visitSchedulerUpdatePrisonDto,
    })
  }
}
