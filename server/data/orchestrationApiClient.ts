import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { PrisonerProfile, VisitHistoryDetails } from './orchestrationApiTypes'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  async getVisitHistory(reference: string): Promise<VisitHistoryDetails> {
    return this.restClient.get({ path: `/visits/${reference}/history` })
  }

  async getPrisonerProfile(prisonId: string, prisonerId: string): Promise<PrisonerProfile> {
    return this.restClient.get({ path: `/prisoner/${prisonId}/${prisonerId}/profile` })
  }
}
