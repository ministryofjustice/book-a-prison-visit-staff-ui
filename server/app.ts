import express from 'express'

import createError from 'http-errors'

import indexRoutes from './routes'
import searchRoutes from './routes/search'
import prisonerRoutes from './routes/prisoner'
import bookAVisitRoutes from './routes/bookAVisit'
import visitRoutes from './routes/visit'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import standardRouter from './routes/standardRouter'
import type UserService from './services/userService'
import { prisonerSearchClientBuilder } from './data/prisonerSearchClient'
import PrisonerSearchService from './services/prisonerSearchService'
import { visitSchedulerApiClientBuilder } from './data/visitSchedulerApiClient'
import { whereaboutsApiClientBuilder } from './data/whereaboutsApiClient'
import { prisonerContactRegistryApiClientBuilder } from './data/prisonerContactRegistryApiClient'
import { prisonApiClientBuilder } from './data/prisonApiClient'
import PrisonerProfileService from './services/prisonerProfileService'
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

  app.use('/', indexRoutes(standardRouter(userService)))
  app.use(
    '/search/',
    searchRoutes(
      standardRouter(userService),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken
      )
    )
  )
  app.use(
    '/prisoner/',
    prisonerRoutes(
      standardRouter(userService),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        systemToken
      ),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken
      )
    )
  )
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(userService),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken
      ),
      new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        prisonerContactRegistryApiClientBuilder,
        systemToken
      )
    )
  )
  app.use(
    '/visit/',
    visitRoutes(
      standardRouter(userService),
      new PrisonerSearchService(prisonerSearchClientBuilder, systemToken),
      new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemToken),
      new VisitSessionsService(
        prisonerContactRegistryApiClientBuilder,
        visitSchedulerApiClientBuilder,
        whereaboutsApiClientBuilder,
        systemToken
      )
    )
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
