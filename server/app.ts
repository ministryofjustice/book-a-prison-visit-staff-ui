import express from 'express'

import createError from 'http-errors'

import dpsComponents from '@ministryofjustice/hmpps-connect-dps-components'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import appInsightsOperationId from './middleware/appInsightsOperationId'
import setUpCsrf from './middleware/setUpCsrf'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import populateSelectedEstablishment from './middleware/populateSelectedEstablishment'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import indexRoutes from './routes'
import visitJourneyRoutes from './routes/visitJourney'
import blockVisitDatesRoutes from './routes/blockVisitDates'
import establishmentNotSupportedRoutes from './routes/establishmentNotSupported'
import prisonerRoutes from './routes/prisoner/prisoner'
import reviewRoutes from './routes/review'
import searchRoutes from './routes/search/search'
import timetableRoutes from './routes/timetable'
import visitRoutes from './routes/visit'
import visitsByDateRoutes from './routes/visitsByDate/visitsByDate'
import type { Services } from './services'
import config from './config'
import logger from '../logger'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(setUpHealthChecks(services.applicationInfo, services.supportedPrisonsService))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_MANAGE_PRISON_VISITS']))
  app.use(setUpCsrf())
  app.get(
    '*any',
    dpsComponents.getPageComponents({
      dpsUrl: config.dpsHome,
      logger,
      includeMeta: true,
    }),
  )
  app.use(setUpCurrentUser())
  app.use(populateSelectedEstablishment(services))
  app.use(appInsightsOperationId)

  app.use('/', indexRoutes(services))
  app.use('/book-a-visit', visitJourneyRoutes(services, 'book'))
  app.use('/update-a-visit', visitJourneyRoutes(services, 'update'))
  app.use('/block-visit-dates', blockVisitDatesRoutes(services))
  app.use('/establishment-not-supported', establishmentNotSupportedRoutes(services))
  app.use('/prisoner', prisonerRoutes(services))
  app.use('/search', searchRoutes(services))
  app.use('/timetable', timetableRoutes(services))
  app.use('/review', reviewRoutes(services))
  app.use('/visit', visitRoutes(services))
  app.use('/visits', visitsByDateRoutes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
