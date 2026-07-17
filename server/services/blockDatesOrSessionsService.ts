import { OrchestrationApiClient } from '../data'
import { ExcludeDateDto, PrisonAndSessionsExcludeDatesDto } from '../data/orchestrationApiTypes'

export default class BlockDatesOrSessionsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async blockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    await this.orchestrationApiClient.blockVisitDate(prisonId, date, username)
  }

  async unblockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    await this.orchestrationApiClient.unblockVisitDate(prisonId, date, username)
  }

  async getFutureBlockedDates(prisonId: string): Promise<ExcludeDateDto[]> {
    return this.orchestrationApiClient.getFutureBlockedDates(prisonId)
  }

  async isBlockedDate(prisonId: string, excludedDate: string): Promise<boolean> {
    return this.orchestrationApiClient.isBlockedDate(prisonId, excludedDate)
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
    await this.orchestrationApiClient.blockVisitSession({ sessionTemplateReference, date, username })
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
    await this.orchestrationApiClient.unblockVisitSession({ sessionTemplateReference, date, username })
  }

  async getFutureBlockedDatesAndSessions({
    prisonId,
    includeSessions,
  }: {
    prisonId: string
    includeSessions: boolean
    username?: string
  }): Promise<PrisonAndSessionsExcludeDatesDto> {
    return this.orchestrationApiClient.getFutureBlockedDatesAndSessions({ prisonId, includeSessions })
  }
}
