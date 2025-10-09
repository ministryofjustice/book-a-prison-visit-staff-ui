import { dataAccess } from '../data'
import AuditService from './auditService'
import BlockedDatesService from './blockedDatesService'
import PrisonerProfileService from './prisonerProfileService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerVisitorsService from './prisonerVisitorsService'
import SupportedPrisonsService from './supportedPrisonsService'
import VisitNotificationsService from './visitNotificationsService'
import VisitRequestsService from './visitRequestsService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'

export const services = () => {
  const {
    hmppsAuthClient,
    orchestrationApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonerSearchClientBuilder,
    applicationInfo,
  } = dataAccess()

  const auditService = new AuditService()

  const blockedDatesService = new BlockedDatesService(orchestrationApiClientBuilder, hmppsAuthClient)

  const supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const prisonerProfileService = new PrisonerProfileService(orchestrationApiClientBuilder, hmppsAuthClient)

  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient)

  const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient)

  const visitNotificationsService = new VisitNotificationsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const visitRequestsService = new VisitRequestsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const visitSessionsService = new VisitSessionsService(orchestrationApiClientBuilder, hmppsAuthClient)

  const visitService = new VisitService(orchestrationApiClientBuilder, hmppsAuthClient)

  return {
    auditService,
    blockedDatesService,
    prisonerProfileService,
    prisonerSearchService,
    prisonerVisitorsService,
    supportedPrisonsService,
    visitNotificationsService,
    visitRequestsService,
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
  VisitRequestsService,
  VisitService,
  VisitSessionsService,
}
