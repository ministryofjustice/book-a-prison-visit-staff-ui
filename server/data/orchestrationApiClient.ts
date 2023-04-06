import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { VisitHistoryDetails } from './orchestrationApiTypes'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  async getVisitHistory(reference: string): Promise<VisitHistoryDetails> {
    return this.restClient.get({ path: `/visits/${reference}/history` })
  }
}
