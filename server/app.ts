import express from 'express'

import createError from 'http-errors'

import indexRoutes from './routes'
import searchRoutes from './routes/search'
import establishmentRoutes from './routes/changeEstablishment'
import prisonerRoutes from './routes/prisoner'
import bookAVisitRoutes from './routes/bookAVisit'
import visitRoutes from './routes/visit'
import visitsRoutes from './routes/visits'
import timetableRoutes from './routes/timetable'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import standardRouter from './routes/standardRouter'
import UserService from './services/userService'
import NotificationsService from './services/notificationsService'
import PrisonerSearchService from './services/prisonerSearchService'
import PrisonerProfileService from './services/prisonerProfileService'
import SupportedPrisonsService from './services/supportedPrisonsService'
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
import HmppsAuthClient from './data/hmppsAuthClient'
import { dataAccess } from './data'

export default function createApp(userService: UserService, hmppsAuthClient: HmppsAuthClient): express.Application {
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
  app.use(authorisationMiddleware(['ROLE_MANAGE_PRISON_VISITS']))
  app.use(appInsightsOperationId)

  const {
    notificationsApiClientBuilder,
    prisonApiClientBuilder,
    prisonerContactRegistryApiClientBuilder,
    prisonRegisterApiClientBuilder,
    prisonerSearchClientBuilder,
    visitSchedulerApiClientBuilder,
    whereaboutsApiClientBuilder,
  } = dataAccess()

  const supportedPrisonsService = new SupportedPrisonsService(
    visitSchedulerApiClientBuilder,
    prisonRegisterApiClientBuilder,
    hmppsAuthClient,
  )

  app.use('/', indexRoutes(standardRouter(userService, supportedPrisonsService)))
  app.use(
    '/change-establishment/',
    establishmentRoutes(
      standardRouter(userService, supportedPrisonsService),
      supportedPrisonsService,
      new AuditService(),
      userService,
    ),
  )
  app.use(
    '/search/',
    searchRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
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
        prisonerSearchClientBuilder,
        supportedPrisonsService,
        hmppsAuthClient,
      ),
      new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
      ),
      new AuditService(),
    ),
  )
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
      ),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        prisonerSearchClientBuilder,
        supportedPrisonsService,
        hmppsAuthClient,
      ),
      new NotificationsService(notificationsApiClientBuilder),
      new AuditService(),
    ),
  )
  app.use(
    '/visit/',
    visitRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
      ),
      new NotificationsService(notificationsApiClientBuilder),
      new AuditService(),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, hmppsAuthClient),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        prisonerSearchClientBuilder,
        supportedPrisonsService,
        hmppsAuthClient,
      ),
      supportedPrisonsService,
    ),
  )
  app.use(
    '/visits/',
    visitsRoutes(
      standardRouter(userService, supportedPrisonsService),
      new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
      ),
      new AuditService(),
    ),
  )

  app.use(
    '/timetable/',
    timetableRoutes(
      standardRouter(userService, supportedPrisonsService),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        hmppsAuthClient,
      ),
    ),
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
