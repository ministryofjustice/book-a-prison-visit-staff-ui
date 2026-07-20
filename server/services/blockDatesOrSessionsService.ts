import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonAndSessionsExcludeDatesDto } from '../data/orchestrationApiTypes'

export default class BlockDatesOrSessionsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async blockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.blockVisitDate(prisonId, date, username)
  }

  async unblockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.unblockVisitDate(prisonId, date, username)
  }

  async isBlockedDate(prisonId: string, excludedDate: string, username: string): Promise<boolean> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.isBlockedDate(prisonId, excludedDate)
  }

  async blockVisitSession({
    sessionTemplateReference,
    date,
    username,
  }: {
    sessionTemplateReference: string
    date: string
    username: string
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.blockVisitSession({ sessionTemplateReference, date, username })
  }

  async unblockVisitSession({
    sessionTemplateReference,
    date,
    username,
  }: {
    sessionTemplateReference: string
    date: string
    username: string
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    await orchestrationApiClient.unblockVisitSession({ sessionTemplateReference, date, username })
  }

  async getFutureBlockedDatesAndSessions({
    prisonId,
    includeSessions,
    username,
  }: {
    prisonId: string
    includeSessions: boolean
    username: string
  }): Promise<PrisonAndSessionsExcludeDatesDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getFutureBlockedDatesAndSessions({ prisonId, includeSessions })
  }
}
