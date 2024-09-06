import { dataAccess } from '../data'
import AuditService from './auditService'
import BlockedDatesService from './blockedDatesService'
import FrontendComponentsService from './frontendComponentsService'
import PrisonerProfileService from './prisonerProfileService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerVisitorsService from './prisonerVisitorsService'
import SupportedPrisonsService from './supportedPrisonsService'
import UserService from './userService'
import VisitNotificationsService from './visitNotificationsService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const {
    hmppsAuthClient,
    manageUsersApiClient,
    nomisUserRolesApiClient,
    frontendComponentsClientBuilder,
    orchestrationApiClientBuilder,
    prisonApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonRegisterApiClientBuilder,
    prisonerSearchClientBuilder,
    whereaboutsApiClientBuilder,
    applicationInfo,
  } = dataAccess()

  const auditService = new AuditService()

  const blockedDatesService = new BlockedDatesService(orchestrationApiClientBuilder, hmppsAuthClient)

  const frontendComponentsService = new FrontendComponentsService(frontendComponentsClientBuilder)

  const supportedPrisonsService = new SupportedPrisonsService(
    orchestrationApiClientBuilder,
    prisonRegisterApiClientBuilder,
    hmppsAuthClient,
  )

  const prisonerProfileService = new PrisonerProfileService(
    orchestrationApiClientBuilder,
    prisonApiClientBuilder,
    hmppsAuthClient,
  )

  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient)

  const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient)

  const userService = new UserService(
    hmppsAuthClient,
    manageUsersApiClient,
    nomisUserRolesApiClient,
    prisonApiClientBuilder,
  )

  const visitNotificationsService = new VisitNotificationsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const visitSessionsService = new VisitSessionsService(
    orchestrationApiClientBuilder,
    whereaboutsApiClientBuilder,
    hmppsAuthClient,
  )

  const visitService = new VisitService(
    orchestrationApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    hmppsAuthClient,
  )

  return {
    auditService,
    blockedDatesService,
    frontendComponentsService,
    prisonerProfileService,
    prisonerSearchService,
    prisonerVisitorsService,
    supportedPrisonsService,
    userService,
    visitNotificationsService,
    visitService,
    visitSessionsService,
    applicationInfo,
  }
}

export type Services = ReturnType<typeof services>

export {
  AuditService,
  BlockedDatesService,
  FrontendComponentsService,
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  UserService,
  VisitNotificationsService,
  VisitService,
  VisitSessionsService,
}
