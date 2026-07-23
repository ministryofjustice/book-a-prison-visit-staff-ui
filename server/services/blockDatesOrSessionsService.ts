import { OrchestrationApiClient } from '../data'
import { PrisonAndSessionsExcludeDatesDto } from '../data/orchestrationApiTypes'

export default class BlockDatesOrSessionsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async blockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    await this.orchestrationApiClient.blockVisitDate(prisonId, date, username)
  }

  async unblockVisitDate(username: string, prisonId: string, date: string): Promise<void> {
    await this.orchestrationApiClient.unblockVisitDate(prisonId, date, username)
  }

  async isBlockedDate(prisonId: string, excludedDate: string, username: string): Promise<boolean> {
    return this.orchestrationApiClient.isBlockedDate(prisonId, excludedDate, username)
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
    username,
  }: {
    prisonId: string
    includeSessions: boolean
    username: string
  }): Promise<PrisonAndSessionsExcludeDatesDto> {
    return this.orchestrationApiClient.getFutureBlockedDatesAndSessions({ prisonId, includeSessions, username })
  }
}
