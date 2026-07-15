import { PrisonRemandConfig } from '../@types/bapv'
import { IncentivesApiClient, OrchestrationApiClient } from '../data'
import { PrisonIncentiveLevel } from '../data/incentivesApiTypes'
import { VisitSchedulerUpdatePrisonDto } from '../data/orchestrationApiTypes'

export default class VisitAllowanceService {
  constructor(
    private readonly incentivesApiClient: IncentivesApiClient,
    private readonly orchestrationApiClient: OrchestrationApiClient,
  ) {}

  async getPrisonIncentiveLevels({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<PrisonIncentiveLevel[]> {
    void username
    const incentivesApiClient = this.incentivesApiClient

    return incentivesApiClient.getPrisonIncentiveLevels(prisonId)
  }

  async getRemandConfig({ username, prisonId }: { username: string; prisonId: string }): Promise<PrisonRemandConfig> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient

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
    void username
    const orchestrationApiClient = this.orchestrationApiClient

    const visitSchedulerUpdatePrisonDto = { weekStartDay, remandVisitLimitPerWeek }

    await orchestrationApiClient.updatePrisonConfig({
      prisonId,
      visitSchedulerUpdatePrisonDto,
    })
  }
}
