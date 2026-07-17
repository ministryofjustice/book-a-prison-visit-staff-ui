import { OrchestrationApiClient } from '../data'
import { VisitRequestResponse, VisitRequestSummary } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async rejectVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    return this.orchestrationApiClient.rejectVisitRequest({ reference, username })
  }

  async approveVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    return this.orchestrationApiClient.approveVisitRequest({ reference, username })
  }

  async getVisitRequests(username: string, prisonId: string): Promise<VisitRequestSummary[]> {
    return this.orchestrationApiClient.getVisitRequests(prisonId)
  }

  async getVisitRequestCount(username: string, prisonId: string): Promise<number> {
    return this.orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
