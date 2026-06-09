import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { PrisonIncentiveLevel } from './incentivesApiTypes'

export default class IncentivesApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('incentivesApiClient', config.apis.incentives as ApiConfig, token)
  }

  async getPrisonIncentiveLevels(prisonId: string): Promise<PrisonIncentiveLevel[]> {
    return this.restClient.get({
      path: `/incentive/prison-levels/${prisonId}`,
    })
  }
}
