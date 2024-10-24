/* eslint-disable import/first */
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
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import {
  AuditService,
  BlockedDatesService,
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  VisitNotificationsService,
  VisitService,
  VisitSessionsService,
} from '..'

jest.mock('..')

export const createMockAuditService = () => new AuditService(null) as jest.Mocked<AuditService>

export const createMockBlockedDatesService = () =>
  new BlockedDatesService(null, null) as jest.Mocked<BlockedDatesService>

export const createMockPrisonerProfileService = () =>
  new PrisonerProfileService(null, null, null) as jest.Mocked<PrisonerProfileService>

export const createMockPrisonerSearchService = () =>
  new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>

export const createMockPrisonerVisitorsService = () =>
  new PrisonerVisitorsService(null, null) as jest.Mocked<PrisonerVisitorsService>

export const createMockSupportedPrisonsService = () =>
  new SupportedPrisonsService(null, null, null) as jest.Mocked<SupportedPrisonsService>

export const createMockVisitNotificationsService = () =>
  new VisitNotificationsService(null, null) as jest.Mocked<VisitNotificationsService>

export const createMockVisitService = () => new VisitService(null, null, null) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(null, null, null) as jest.Mocked<VisitSessionsService>
