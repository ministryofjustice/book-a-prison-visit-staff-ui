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
import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import appInsightsOperationId from './middleware/appInsightsOperationId'
import type { Services } from './services'

export default function createApp(services: Services): express.Application {
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

  app.use('/', indexRoutes(standardRouter(services)))
  app.use('/book-a-visit/', bookAVisitRoutes(standardRouter(services), services))
  app.use('/change-establishment/', establishmentRoutes(standardRouter(services), services))
  app.use('/prisoner/', prisonerRoutes(standardRouter(services), services))
  app.use('/search/', searchRoutes(standardRouter(services), services))
  app.use('/timetable/', timetableRoutes(standardRouter(services), services))
  app.use('/visit/', visitRoutes(standardRouter(services), services))
  app.use('/visits/', visitsRoutes(standardRouter(services), services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
