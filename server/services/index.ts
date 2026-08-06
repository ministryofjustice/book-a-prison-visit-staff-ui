import { dataAccess } from '../data'
import AuditService from './auditService'
import BlockDatesOrSessionsService from './blockDatesOrSessionsService'
import BookerService from './bookerService'
import PrisonerProfileService from './prisonerProfileService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerVisitorsService from './prisonerVisitorsService'
import SupportedPrisonsService from './supportedPrisonsService'
import VisitOrdersService from './visitOrders/visitOrdersService'
import VisitNotificationsService from './visitNotificationsService'
import VisitRequestsService from './visitRequestsService'
import VisitService from './visitService'
import VisitSessionsService from './visitSessionsService'
import VisitAllowanceService from './visitAllowanceService'

export const services = () => {
  const {
    orchestrationApiClient,
    prisonerContactRegistryApiClient,
    prisonerSearchClient,
    incentivesApiClient,
    applicationInfo,
  } = dataAccess()

  const auditService = new AuditService()

  const blockDatesOrSessionsService = new BlockDatesOrSessionsService(orchestrationApiClient)

  const bookerService = new BookerService(orchestrationApiClient)

  const supportedPrisonsService = new SupportedPrisonsService(orchestrationApiClient)

  const prisonerProfileService = new PrisonerProfileService(orchestrationApiClient)

  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClient)

  const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClient)

  const visitAllowanceService = new VisitAllowanceService(incentivesApiClient, orchestrationApiClient)

  const visitNotificationsService = new VisitNotificationsService(orchestrationApiClient)

  const visitOrdersService = new VisitOrdersService(orchestrationApiClient)

  const visitRequestsService = new VisitRequestsService(orchestrationApiClient)

  const visitSessionsService = new VisitSessionsService(orchestrationApiClient)

  const visitService = new VisitService(orchestrationApiClient)

  return {
    auditService,
    blockDatesOrSessionsService,
    bookerService,
    prisonerProfileService,
    prisonerSearchService,
    prisonerVisitorsService,
    supportedPrisonsService,
    visitAllowanceService,
    visitNotificationsService,
    visitOrdersService,
    visitRequestsService,
    visitService,
    visitSessionsService,
    applicationInfo,
  }
}

export type Services = ReturnType<typeof services>

export {
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
}
