import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { PrisonIncentiveLevel } from './incentivesApiTypes'

export default class IncentivesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('incentivesApiClient', config.apis.incentives, logger, authenticationClient)
  }

  async getPrisonIncentiveLevels(prisonId: string, username: string): Promise<PrisonIncentiveLevel[]> {
    return this.get(
      {
        path: `/incentive/prison-levels/${prisonId}`,
      },
      asSystem(username),
    )
  }
}
