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
    return this.incentivesApiClient.getPrisonIncentiveLevels(prisonId, username)
  }

  async getRemandConfig({ username, prisonId }: { username: string; prisonId: string }): Promise<PrisonRemandConfig> {
    const prison = await this.orchestrationApiClient.getPrison(prisonId, username)

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
    const visitSchedulerUpdatePrisonDto = { weekStartDay, remandVisitLimitPerWeek }

    await this.orchestrationApiClient.updatePrisonConfig({
      prisonId,
      visitSchedulerUpdatePrisonDto,
      username,
    })
  }
}
