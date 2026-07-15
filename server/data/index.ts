import { RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import HmppsAuthClient from './hmppsAuthClient'
import IncentivesApiClient from './incentivesApiClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import { createRedisClient } from './redisClient'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

export type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new RedisTokenStore(createRedisClient())),

  incentivesApiClientBuilder: ((token: string) =>
    new IncentivesApiClient(token)) as RestClientBuilder<IncentivesApiClient>,
  orchestrationApiClientBuilder: ((token: string) =>
    new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
  prisonerContactRegistryApiClientBuilder: ((token: string) =>
    new PrisonerContactRegistryApiClient(token)) as RestClientBuilder<PrisonerContactRegistryApiClient>,
  prisonerSearchClientBuilder: ((token: string) =>
    new PrisonerSearchClient(token)) as RestClientBuilder<PrisonerSearchClient>,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  IncentivesApiClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
}
