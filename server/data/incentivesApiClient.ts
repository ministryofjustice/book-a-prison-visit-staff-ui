import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonIncentiveLevel } from './incentivesApiTypes'

export default class IncentivesApiClient {
  private restClient: Pick<RestClient, 'get'>

  constructor(token: string) {
    const client = new RestClient('incentivesApiClient', config.apis.incentives, logger)
    this.restClient = {
      get: (request, authOptions) => client.get(request, authOptions ?? asUser(token)),
    }
  }

  async getPrisonIncentiveLevels(prisonId: string): Promise<PrisonIncentiveLevel[]> {
    return this.restClient.get({
      path: `/incentive/prison-levels/${prisonId}`,
    })
  }
}
