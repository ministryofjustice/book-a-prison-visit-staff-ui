import express from 'express'

import path from 'path'
import createError from 'http-errors'

import indexRoutes from './routes'
import searchRoutes from './routes/search'
import prisonerRoutes from './routes/prisoner'
import visitorsRoutes from './routes/visitors'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import standardRouter from './routes/standardRouter'
import type UserService from './services/userService'
import { prisonerSearchClientBuilder } from './data/prisonerSearchClient'
import PrisonerSearchService from './services/prisonerSearchService'
import { visitSchedulerApiClientBuilder } from './data/visitSchedulerApiClient'
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
  nunjucksSetup(app, path)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())

  app.use('/', indexRoutes(standardRouter(userService)))
  app.use(
    '/search/',
    searchRoutes(standardRouter(userService), new PrisonerSearchService(prisonerSearchClientBuilder, systemToken))
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
      )
    )
  )
  app.use(
    '/select-visitors',
    visitorsRoutes(
      standardRouter(userService),
      new PrisonerVisitorsService(prisonApiClientBuilder, prisonerContactRegistryApiClientBuilder, systemToken)
    )
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
