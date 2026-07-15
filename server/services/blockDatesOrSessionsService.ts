import { OrchestrationApiClient } from '../data'
import { ExcludeDateDto, PrisonAndSessionsExcludeDatesDto } from '../data/orchestrationApiTypes'

export default class BlockDatesOrSessionsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async blockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const orchestrationApiClient = this.orchestrationApiClient
    await orchestrationApiClient.blockVisitDate(prisonId, date, username)
  }

  async unblockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    const orchestrationApiClient = this.orchestrationApiClient
    await orchestrationApiClient.unblockVisitDate(prisonId, date, username)
  }

  async getFutureBlockedDates(prisonId: string, username: string): Promise<ExcludeDateDto[]> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient
    return orchestrationApiClient.getFutureBlockedDates(prisonId)
  }

  async isBlockedDate(prisonId: string, excludedDate: string, username: string): Promise<boolean> {
    void username
    const orchestrationApiClient = this.orchestrationApiClient

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
    const orchestrationApiClient = this.orchestrationApiClient
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
    const orchestrationApiClient = this.orchestrationApiClient
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
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getFutureBlockedDatesAndSessions({ prisonId, includeSessions })
  }
}
