import express from 'express'

import createError from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import appInsightsOperationId from './middleware/appInsightsOperationId'
import setUpCsrf from './middleware/setUpCsrf'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import indexRoutes from './routes'
import bookAVisitRoutes from './routes/bookAVisit'
import establishmentRoutes from './routes/changeEstablishment'
import prisonerRoutes from './routes/prisoner'
import searchRoutes from './routes/search'
import timetableRoutes from './routes/timetable'
import visitRoutes from './routes/visit'
import visitsRoutes from './routes/visits'
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
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))
  app.use(appInsightsOperationId)

  app.use('/', indexRoutes())
  app.use('/book-a-visit', bookAVisitRoutes(services))
  app.use('/change-establishment', establishmentRoutes(services))
  app.use('/prisoner', prisonerRoutes(services))
  app.use('/search', searchRoutes(services))
  app.use('/timetable', timetableRoutes(services))
  app.use('/visit', visitRoutes(services))
  app.use('/visits', visitsRoutes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
