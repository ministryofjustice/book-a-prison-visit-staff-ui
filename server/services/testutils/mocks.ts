import {
  AdditionalSupportService,
  AuditService,
  NotificationsService,
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  UserService,
  VisitService,
  VisitSessionsService,
} from '..'

jest.mock('..')

export const createMockAdditionalSupportService = () =>
  new AdditionalSupportService(null, null) as jest.Mocked<AdditionalSupportService>

export const createMockAuditService = () => new AuditService(null, null, null, null) as jest.Mocked<AuditService>

export const createMockNotificationsService = () => new NotificationsService(null) as jest.Mocked<NotificationsService>

export const createMockPrisonerProfileService = () =>
  new PrisonerProfileService(null, null, null, null) as jest.Mocked<PrisonerProfileService>

export const createMockPrisonerSearchService = () =>
  new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>

export const createMockPrisonerVisitorsService = () =>
  new PrisonerVisitorsService(null, null) as jest.Mocked<PrisonerVisitorsService>

export const createMockSupportedPrisonsService = () =>
  new SupportedPrisonsService(null, null, null) as jest.Mocked<SupportedPrisonsService>

export const createMockUserService = () => new UserService(null, null) as jest.Mocked<UserService>

export const createMockVisitService = () => new VisitService(null, null, null, null) as jest.Mocked<VisitService>

export const createMockVisitSessionsService = () =>
  new VisitSessionsService(null, null, null) as jest.Mocked<VisitSessionsService>
