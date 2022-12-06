import express from 'express'
import createError from 'http-errors'

import type UserService from './services/userService'

import indexRoutes from './routes'
import searchRoutes from './routes/search'
import establishmentRoutes from './routes/changeEstablishment'
import prisonerRoutes from './routes/prisoner'
import bookAVisitRoutes from './routes/bookAVisit'
import visitRoutes from './routes/visit'
import visitsRoutes from './routes/visits'
import standardRouter from './routes/standardRouter'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import appInsightsOperationId from './middleware/appInsightsOperationId'
import {
  supportedPrisonsService,
  visitSessionsService,
  prisonerSearchService,
  prisonerVisitorsService,
  prisonerProfileService,
  notificationsService,
  auditService,
} from './services'

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

  app.use('/', indexRoutes(standardRouter(userService)))
  app.use(
    '/change-establishment/',
    establishmentRoutes(standardRouter(userService), supportedPrisonsService, auditService),
  )
  app.use(
    '/search/',
    searchRoutes(standardRouter(userService), prisonerSearchService, visitSessionsService, auditService),
  )
  app.use(
    '/prisoner/',
    prisonerRoutes(
      standardRouter(userService),
      prisonerProfileService,
      prisonerSearchService,
      visitSessionsService,
      auditService,
    ),
  )
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(userService),
      prisonerVisitorsService,
      visitSessionsService,
      prisonerProfileService,
      notificationsService,
      auditService,
    ),
  )
  app.use(
    '/visit/',
    visitRoutes(
      standardRouter(userService),
      prisonerSearchService,
      visitSessionsService,
      notificationsService,
      auditService,
      prisonerVisitorsService,
      prisonerProfileService,
      supportedPrisonsService,
    ),
  )
  app.use(
    '/visits/',
    visitsRoutes(standardRouter(userService), prisonerSearchService, visitSessionsService, auditService),
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
