/* eslint-disable import/first */
/*
 * Do app insights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'

initialiseAppInsights()
buildAppInsightsClient()

import HmppsAuthClient from './hmppsAuthClient'
import NotificationsApiClient from './notificationsApiClient'
import PrisonApiClient from './prisonApiClient'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import VisitSchedulerApiClient from './visitSchedulerApiClient'
import WhereaboutsApiClient from './whereaboutsApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient())),
  notificationsApiClientBuilder: () => new NotificationsApiClient(),
  prisonApiClientBuilder: ((token: string) => new PrisonApiClient(token)) as RestClientBuilder<PrisonApiClient>,
  prisonerContactRegistryApiClientBuilder: ((token: string) =>
    new PrisonerContactRegistryApiClient(token)) as RestClientBuilder<PrisonerContactRegistryApiClient>,
  prisonerSearchClientBuilder: ((token: string) =>
    new PrisonerSearchClient(token)) as RestClientBuilder<PrisonerSearchClient>,
  prisonRegisterApiClientBuilder: ((token: string) =>
    new PrisonRegisterApiClient(token)) as RestClientBuilder<PrisonRegisterApiClient>,
  visitSchedulerApiClientBuilder: ((token: string) =>
    new VisitSchedulerApiClient(token)) as RestClientBuilder<VisitSchedulerApiClient>,
  whereaboutsApiClientBuilder: ((token: string) =>
    new WhereaboutsApiClient(token)) as RestClientBuilder<WhereaboutsApiClient>,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  NotificationsApiClient,
  PrisonApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
  PrisonRegisterApiClient,
  RestClientBuilder,
  VisitSchedulerApiClient,
  WhereaboutsApiClient,
}
