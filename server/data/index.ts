import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import IncentivesApiClient from './incentivesApiClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import { createRedisClient } from './redisClient'
import applicationInfoSupplier from '../applicationInfo'
import logger from '../../logger'
import config from '../config'
import RedisDataCache from './dataCache/redisDataCache'
import InMemoryDataCache from './dataCache/inMemoryDataCache'
import type { DataCache } from './dataCache/dataCache'

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
  dataCache: config.redis.enabled ? new RedisDataCache(redisClient!) : new InMemoryDataCache(),
  incentivesApiClient: new IncentivesApiClient(hmppsAuthClient),
  orchestrationApiClient: new OrchestrationApiClient(hmppsAuthClient),
  prisonerContactRegistryApiClient: new PrisonerContactRegistryApiClient(hmppsAuthClient),
  prisonerSearchClient: new PrisonerSearchClient(hmppsAuthClient),
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  AuthenticationClient,
  DataCache,
  IncentivesApiClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
}
