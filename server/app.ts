import express from 'express'

import createError from 'http-errors'

import indexRoutes from './routes'
import searchRoutes from './routes/search'
import establishmentRoutes from './routes/changeEstablishment'
import prisonerRoutes from './routes/prisoner'
import bookAVisitRoutes from './routes/bookAVisit'
import visitRoutes from './routes/visit'
import visitsRoutes from './routes/visits'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import standardRouter from './routes/standardRouter'
import type UserService from './services/userService'
import { prisonerSearchClientBuilder } from './data/prisonerSearchClient'
import { notificationsApiClientBuilder } from './data/notificationsApiClient'
import { visitSchedulerApiClientBuilder } from './data/visitSchedulerApiClient'
import { whereaboutsApiClientBuilder } from './data/whereaboutsApiClient'
import { prisonerContactRegistryApiClientBuilder } from './data/prisonerContactRegistryApiClient'
import { prisonApiClientBuilder } from './data/prisonApiClient'
import { prisonRegisterApiClientBuilder } from './data/prisonRegisterApiClient'
import NotificationsService from './services/notificationsService'
import PrisonerSearchService from './services/prisonerSearchService'
import PrisonerProfileService from './services/prisonerProfileService'
import SupportedPrisonsService from './services/supportedPrisonsService'
import systemToken from './data/authClient'
import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import PrisonerVisitorsService from './services/prisonerVisitorsService'
import VisitSessionsService from './services/visitSessionsService'
import AuditService from './services/auditService'
import appInsightsOperationId from './middleware/appInsightsOperationId'

export default function createApp(userService: UserService): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(appInsightsOperationId)

  const supportedPrisonsService = new SupportedPrisonsService(
    visitSchedulerApiClientBuilder,
    prisonRegisterApiClientBuilder,
    systemToken,
  )

  app.use('/', indexRoutes(standardRouter(userService, supportedPrisonsService)))
  app.use(
    '/change-establishment/',
    establishmentRoutes(
      standardRouter(userService, supportedPrisonsService),
      supportedPrisonsService,
      new AuditService(),
    ),
  )
  app.use(
    '/search/',
    searchRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken,
      ),
      new AuditService(),
    ),
  )
  app.use(
    '/prisoner/',
    prisonerRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        supportedPrisonsService,
        systemToken,
      ),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken,
      ),
      new AuditService(),
    ),
  )
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken,
      ),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        supportedPrisonsService,
        systemToken,
      ),
      new NotificationsService(notificationsApiClientBuilder),
      new AuditService(),
    ),
  )
  app.use(
    '/visit/',
    visitRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken,
      ),
      new NotificationsService(notificationsApiClientBuilder),
      new AuditService(),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemToken),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        supportedPrisonsService,
        systemToken,
      ),
      supportedPrisonsService,
    ),
  )
  app.use(
    '/visits/',
    visitsRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken,
      ),
      new AuditService(),
    ),
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
