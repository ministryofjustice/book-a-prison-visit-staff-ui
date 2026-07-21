import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { VisitRequestRejectionReason, VisitRequestResponse, VisitRequestSummary } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async rejectVisitRequest({
    username,
    reference,
    visitRequestRejectionReason,
  }: {
    username: string
    reference: string
    visitRequestRejectionReason: VisitRequestRejectionReason
  }): Promise<VisitRequestResponse> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.rejectVisitRequest({ reference, username, visitRequestRejectionReason })
  }

  async approveVisitRequest({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<VisitRequestResponse> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.approveVisitRequest({ reference, username })
  }

  async getVisitRequests(username: string, prisonId: string): Promise<VisitRequestSummary[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitRequests(prisonId)
  }

  async getVisitRequestCount(username: string, prisonId: string): Promise<number> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
