/* eslint-disable import/first */
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
/*
 * Import from '..' (server/data/index.ts) fails if applicationInfo not mocked first. This is
 * because paths in it differ between running app (in 'dist') and where ts-jest runs.
 */
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  productId: 'UNASSIGNED',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import {
  HmppsAuthClient,
  IncentivesApiClient,
  OrchestrationApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
} from '..'

jest.mock('..')
export const createMockHmppsAuthClient = () => new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

export const createMockIncentivesApiClient = () =>
  new IncentivesApiClient({} as AuthenticationClient) as jest.Mocked<IncentivesApiClient>

export const createMockOrchestrationApiClient = () =>
  new OrchestrationApiClient({} as AuthenticationClient) as jest.Mocked<OrchestrationApiClient>

export const createMockPrisonerContactRegistryApiClient = () =>
  new PrisonerContactRegistryApiClient({} as AuthenticationClient) as jest.Mocked<PrisonerContactRegistryApiClient>

export const createMockPrisonerSearchClient = () =>
  new PrisonerSearchClient({} as AuthenticationClient) as jest.Mocked<PrisonerSearchClient>
