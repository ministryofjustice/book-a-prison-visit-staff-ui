import {
  HmppsAuthClient,
  ManageUsersApiClient,
  NomisUserRolesApiClient,
  NotificationsApiClient,
  OrchestrationApiClient,
  PrisonApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
  PrisonRegisterApiClient,
  WhereaboutsApiClient,
} from '..'

jest.mock('..')

export const createMockHmppsAuthClient = () => new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

export const createMockManageUsersApiClient = () => new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>

export const createMockNomisUserRolesApiClient = () =>
  new NomisUserRolesApiClient() as jest.Mocked<NomisUserRolesApiClient>

export const createMockNotificationsApiClient = () =>
  new NotificationsApiClient() as jest.Mocked<NotificationsApiClient>

export const createMockOrchestrationApiClient = () =>
  new OrchestrationApiClient(null) as jest.Mocked<OrchestrationApiClient>

export const createMockPrisonApiClient = () => new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>

export const createMockPrisonerContactRegistryApiClient = () =>
  new PrisonerContactRegistryApiClient(null) as jest.Mocked<PrisonerContactRegistryApiClient>

export const createMockPrisonerSearchClient = () => new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

export const createMockPrisonRegisterApiClient = () =>
  new PrisonRegisterApiClient(null) as jest.Mocked<PrisonRegisterApiClient>

export const createMockWhereaboutsApiClient = () => new WhereaboutsApiClient(null) as jest.Mocked<WhereaboutsApiClient>
