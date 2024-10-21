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
import PrisonApiClient from './prisonApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import WhereaboutsApiClient from './whereaboutsApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient())),

  orchestrationApiClientBuilder: ((token: string) =>
    new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
  prisonApiClientBuilder: ((token: string) => new PrisonApiClient(token)) as RestClientBuilder<PrisonApiClient>,
  prisonerContactRegistryApiClientBuilder: ((token: string) =>
    new PrisonerContactRegistryApiClient(token)) as RestClientBuilder<PrisonerContactRegistryApiClient>,
  prisonerSearchClientBuilder: ((token: string) =>
    new PrisonerSearchClient(token)) as RestClientBuilder<PrisonerSearchClient>,
  prisonRegisterApiClientBuilder: ((token: string) =>
    new PrisonRegisterApiClient(token)) as RestClientBuilder<PrisonRegisterApiClient>,
  whereaboutsApiClientBuilder: ((token: string) =>
    new WhereaboutsApiClient(token)) as RestClientBuilder<WhereaboutsApiClient>,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  OrchestrationApiClient,
  PrisonApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
  PrisonRegisterApiClient,
  RestClientBuilder,
  WhereaboutsApiClient,
}
