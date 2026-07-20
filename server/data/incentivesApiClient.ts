import { RestClient as HmppsRestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import config, { ApiConfig } from '../config'
import logger from '../../logger'
import { PrisonIncentiveLevel } from './incentivesApiTypes'

export default class IncentivesApiClient {
  private readonly restClient: HmppsRestClient

  constructor(private readonly token: string) {
    this.restClient = new HmppsRestClient('incentivesApiClient', config.apis.incentives as ApiConfig, logger)
  }

  async getPrisonIncentiveLevels(prisonId: string): Promise<PrisonIncentiveLevel[]> {
    return this.restClient.get(
      {
        path: `/incentive/prison-levels/${prisonId}`,
      },
      asUser(this.token),
    )
  }
}
