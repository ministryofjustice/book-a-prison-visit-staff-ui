import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { VisitRequestResponse, VisitRequestsCountDto, VisitRequestSummary } from '../data/orchestrationApiTypes'

export default class VisitRequestsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async rejectVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.rejectVisitRequest({ reference, username })
  }

  async approveVisitRequest(username: string, reference: string): Promise<VisitRequestResponse> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.approveVisitRequest({ reference, username })
  }

  async getVisitRequests(username: string, prisonId: string): Promise<VisitRequestSummary[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitRequests(prisonId)
  }

  async getVisitRequestCount(username: string, prisonId: string): Promise<VisitRequestsCountDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitRequestCount(prisonId)
  }
}
