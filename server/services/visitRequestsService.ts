import { OrchestrationApiClient } from '../data'
import { VisitRequestResponse, VisitRequestSummary } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async rejectVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.rejectVisitRequest({ reference, username })
  }

  async approveVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.approveVisitRequest({ reference, username })
  }

  async getVisitRequests(username: string, prisonId: string): Promise<VisitRequestSummary[]> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getVisitRequests(prisonId)
  }

  async getVisitRequestCount(username: string, prisonId: string): Promise<number> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
