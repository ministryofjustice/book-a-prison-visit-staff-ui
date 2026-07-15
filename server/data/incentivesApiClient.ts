import { type AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonIncentiveLevel } from './incentivesApiTypes'

type GetRequest = Parameters<RestClient['get']>[0]

export default class IncentivesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('incentivesApiClient', config.apis.incentives, logger, authenticationClient)
  }

  private systemGet<Response = unknown>(request: GetRequest): Promise<Response> {
    return this.get(request, asSystem()) as Promise<Response>
  }

  async getPrisonIncentiveLevels(prisonId: string): Promise<PrisonIncentiveLevel[]> {
    return this.systemGet({
      path: `/incentive/prison-levels/${prisonId}`,
    })
  }
}
