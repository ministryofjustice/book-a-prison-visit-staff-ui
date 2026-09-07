import { OrchestrationApiClient } from '../data'
import { VisitRequestRejectionReason, VisitRequestResponse, VisitRequestSummary } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async rejectVisitRequest({
    username,
    reference,
    visitRequestRejectionReason,
  }: {
    username: string
    reference: string
    visitRequestRejectionReason: VisitRequestRejectionReason | null
  }): Promise<VisitRequestResponse> {
    return this.orchestrationApiClient.rejectVisitRequest({ reference, username, visitRequestRejectionReason })
  }

  async approveVisitRequest({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<VisitRequestResponse> {
    return this.orchestrationApiClient.approveVisitRequest({ reference, username })
  }

  async getVisitRequests(prisonId: string): Promise<VisitRequestSummary[]> {
    return this.orchestrationApiClient.getVisitRequests(prisonId)
  }

  async getVisitRequestCount(prisonId: string): Promise<number> {
    return this.orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
