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
  productId: 'UNASSIGNED',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import {
  AuditService,
  BlockDatesOrSessionsService,
  BookerService,
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  VisitAllowanceService,
  VisitNotificationsService,
  VisitOrdersService,
  VisitRequestsService,
  VisitService,
  VisitSessionsService,
} from '..'

jest.mock('..')

export const createMockAuditService = () => new AuditService(null) as jest.Mocked<AuditService>

export const createMockBlockDatesOrSessionsService = () =>
  new BlockDatesOrSessionsService(null) as jest.Mocked<BlockDatesOrSessionsService>

export const createMockBookerService = () => new BookerService(null) as jest.Mocked<BookerService>

export const createMockPrisonerProfileService = () =>
  new PrisonerProfileService(null) as jest.Mocked<PrisonerProfileService>

export const createMockPrisonerSearchService = () =>
  new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

export const createMockPrisonerVisitorsService = () =>
  new PrisonerVisitorsService(null) as jest.Mocked<PrisonerVisitorsService>

export const createMockSupportedPrisonsService = () =>
  new SupportedPrisonsService(null) as jest.Mocked<SupportedPrisonsService>

export const createMockVisitNotificationsService = () =>
  new VisitNotificationsService(null) as jest.Mocked<VisitNotificationsService>

export const createMockVisitAllowanceService = () =>
  new VisitAllowanceService(null, null) as jest.Mocked<VisitAllowanceService>

export const createMockVisitOrdersService = () => new VisitOrdersService(null) as jest.Mocked<VisitOrdersService>

export const createMockVisitRequestsService = () =>
  new VisitRequestsService(null) as jest.Mocked<VisitRequestsService>

export const createMockVisitService = () => new VisitService(null) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(null) as jest.Mocked<VisitSessionsService>
