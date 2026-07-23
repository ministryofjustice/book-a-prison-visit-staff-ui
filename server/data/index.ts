import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import IncentivesApiClient from './incentivesApiClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import { createRedisClient } from './redisClient'
import applicationInfoSupplier from '../applicationInfo'
import logger from '../../logger'
import config from '../config'

const applicationInfo = applicationInfoSupplier()

const redisClient = config.redis.enabled ? createRedisClient() : null
const hmppsAuthClient = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(redisClient!) : new InMemoryTokenStore(),
)

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient,

  incentivesApiClient: new IncentivesApiClient(hmppsAuthClient),
  orchestrationApiClient: new OrchestrationApiClient(hmppsAuthClient),
  prisonerContactRegistryApiClient: new PrisonerContactRegistryApiClient(hmppsAuthClient),
  prisonerSearchClient: new PrisonerSearchClient(hmppsAuthClient),
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  AuthenticationClient,
  IncentivesApiClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
}
