import { dataAccess } from '../data'
import AuditService from './auditService'
import BlockedDatesService from './blockedDatesService'
import PrisonerProfileService from './prisonerProfileService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerVisitorsService from './prisonerVisitorsService'
import SupportedPrisonsService from './supportedPrisonsService'
import VisitNotificationsService from './visitNotificationsService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const {
    hmppsAuthClient,
    orchestrationApiClientBuilder,
    prisonApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonerSearchClientBuilder,
    whereaboutsApiClientBuilder,
    applicationInfo,
  } = dataAccess()

  const auditService = new AuditService()

  const blockedDatesService = new BlockedDatesService(orchestrationApiClientBuilder, hmppsAuthClient)

  const supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const prisonerProfileService = new PrisonerProfileService(
    orchestrationApiClientBuilder,
    prisonApiClientBuilder,
    hmppsAuthClient,
  )

  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient)

  const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient)

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
    prisonerProfileService,
    prisonerSearchService,
    prisonerVisitorsService,
    supportedPrisonsService,
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
  PrisonerProfileService,
  PrisonerSearchService,
  PrisonerVisitorsService,
  SupportedPrisonsService,
  VisitNotificationsService,
  VisitService,
  VisitSessionsService,
}
