import { dataAccess } from '../data'
import AuditService from './auditService'
import NotificationsService from './notificationsService'
import PrisonerProfileService from './prisonerProfileService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerVisitorsService from './prisonerVisitorsService'
import SupportedPrisonsService from './supportedPrisonsService'
import UserService from './userService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const {
    hmppsAuthClient,
    notificationsApiClientBuilder,
    orchestrationApiClientBuilder,
    prisonApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonRegisterApiClientBuilder,
    prisonerSearchClientBuilder,
    visitSchedulerApiClientBuilder,
    whereaboutsApiClientBuilder,
  } = dataAccess()

  const auditService = new AuditService()

  const notificationsService = new NotificationsService(notificationsApiClientBuilder)

  const supportedPrisonsService = new SupportedPrisonsService(
    visitSchedulerApiClientBuilder,
    prisonRegisterApiClientBuilder,
    hmppsAuthClient,
  )

  const prisonerProfileService = new PrisonerProfileService(
    prisonApiClientBuilder,
    visitSchedulerApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonerSearchClientBuilder,
    supportedPrisonsService,
    hmppsAuthClient,
  )

  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient)

  const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient)

  const userService = new UserService(hmppsAuthClient, prisonApiClientBuilder)

  const visitSessionsService = new VisitSessionsService(
    prisonerContactRegistryApiClientBuilder,
    visitSchedulerApiClientBuilder,
    whereaboutsApiClientBuilder,
    hmppsAuthClient,
  )

  const visitService = new VisitService(
    orchestrationApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    visitSessionsService,
    hmppsAuthClient,
  )

  return {
    auditService,
    notificationsService,
    prisonerProfileService,
    prisonerSearchService,
    prisonerVisitorsService,
    supportedPrisonsService,
    userService,
    visitService,
    visitSessionsService,
  }
}

export type Services = ReturnType<typeof services>

export {
  AuditService,
  NotificationsService,
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  UserService,
  VisitService,
  VisitSessionsService,
}
