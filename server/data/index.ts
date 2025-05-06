/* eslint-disable import/first */
/*
 * Do app insights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import WhereaboutsApiClient from './whereaboutsApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient())),

  orchestrationApiClientBuilder: ((token: string) =>
    new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
  prisonerContactRegistryApiClientBuilder: ((token: string) =>
    new PrisonerContactRegistryApiClient(token)) as RestClientBuilder<PrisonerContactRegistryApiClient>,
  prisonerSearchClientBuilder: ((token: string) =>
    new PrisonerSearchClient(token)) as RestClientBuilder<PrisonerSearchClient>,
  whereaboutsApiClientBuilder: ((token: string) =>
    new WhereaboutsApiClient(token)) as RestClientBuilder<WhereaboutsApiClient>,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
  RestClientBuilder,
  WhereaboutsApiClient,
}
