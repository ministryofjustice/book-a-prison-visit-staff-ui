import { AuthenticationClient, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import HmppsAuthClient from './hmppsAuthClient'
import IncentivesApiClient from './incentivesApiClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import { createRedisClient } from './redisClient'
import config from '../config'
import applicationInfoSupplier from '../applicationInfo'
import logger from '../../logger'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => {
  const authenticationClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    new RedisTokenStore(createRedisClient()),
  )

  return {
    applicationInfo,

    incentivesApiClient: new IncentivesApiClient(authenticationClient),
    orchestrationApiClient: new OrchestrationApiClient(authenticationClient),
    prisonerContactRegistryApiClient: new PrisonerContactRegistryApiClient(authenticationClient),
    prisonerSearchClient: new PrisonerSearchClient(authenticationClient),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  IncentivesApiClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
}
