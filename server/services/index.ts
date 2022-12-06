import { prisonerSearchClientBuilder } from '../data/prisonerSearchClient'
import { notificationsApiClientBuilder } from '../data/notificationsApiClient'
import { visitSchedulerApiClientBuilder } from '../data/visitSchedulerApiClient'
import { whereaboutsApiClientBuilder } from '../data/whereaboutsApiClient'
import { prisonerContactRegistryApiClientBuilder } from '../data/prisonerContactRegistryApiClient'
import { prisonApiClientBuilder } from '../data/prisonApiClient'
import { prisonRegisterApiClientBuilder } from '../data/prisonRegisterApiClient'
import NotificationsService from './notificationsService'
import PrisonerSearchService from './prisonerSearchService'
import PrisonerProfileService from './prisonerProfileService'
import SupportedPrisonsService from './supportedPrisonsService'
import systemToken from '../data/authClient'
import PrisonerVisitorsService from './prisonerVisitorsService'
import VisitSessionsService from './visitSessionsService'
import AuditService from './auditService'

const supportedPrisonsService = new SupportedPrisonsService(
  visitSchedulerApiClientBuilder,
  prisonRegisterApiClientBuilder,
  systemToken,
)
const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, systemToken)
const visitSessionsService = new VisitSessionsService(
  prisonerContactRegistryApiClientBuilder,
  visitSchedulerApiClientBuilder,
  whereaboutsApiClientBuilder,
  systemToken,
)
const prisonerProfileService = new PrisonerProfileService(
  prisonApiClientBuilder,
  visitSchedulerApiClientBuilder,
  prisonerContactRegistryApiClientBuilder,
  supportedPrisonsService,
  systemToken,
)
const prisonerVisitorsService = new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemToken)
const notificationsService = new NotificationsService(notificationsApiClientBuilder)
const auditService = new AuditService()

export {
  supportedPrisonsService,
  prisonerSearchService,
  visitSessionsService,
  prisonerProfileService,
  prisonerVisitorsService,
  notificationsService,
  auditService,
}
