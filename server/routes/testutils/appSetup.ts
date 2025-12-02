/* eslint-disable import/first */
// eslint-disable-next-line import/order
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  productId: 'UNASSIGNED',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import express, { Express } from 'express'
import { NotFound } from 'http-errors'
import { Session, SessionData } from 'express-session'
import { ValidationError } from 'express-validator'
import HeaderFooterSharedData from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterSharedData'

import indexRoutes from '../index'
import visitJourneyRoutes from '../visitJourney'
import blockVisitDatesRoutes from '../blockVisitDates'
import bookerManagementRoutes from '../bookerManagement'
import establishmentNotSupportedRoutes from '../establishmentNotSupported'
import maintenancePageRoute from '../maintenancePageRoute'
import prisonerRoutes from '../prisoner/prisoner'
import requestRoutes from '../request'
import reviewRoutes from '../review'
import searchRoutes from '../search/search'
import timetableRoutes from '../timetable'
import visitRoutes from '../visit'
import visitsRoutes from '../visitsByDate/visitsByDate'

import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import populateSelectedEstablishment from '../../middleware/populateSelectedEstablishment'
import type { Services } from '../../services'
import { FlashFormValues, MoJAlert } from '../../@types/bapv'
import TestData from './testData'
import { PrisonUser } from '../../interfaces/hmppsUser'

export const user: PrisonUser = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
  activeCaseLoadId: 'HEI',
}

export type FlashData = {
  errors?: ValidationError[]
  formValues?: FlashFormValues[]
  messages?: MoJAlert[]
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => PrisonUser,
  sessionData: SessionData,
  feComponents: {
    sharedData?: HeaderFooterSharedData
  },
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user } as PrisonUser,
      feComponents,
    }

    // res.locals.appInsightsOperationId = 'operationId' // FIXME

    // set default 'selectedEstablishment' unless explicitly set with corresponding service for 'populateSelectedEstablishment()'
    if (!sessionData.selectedEstablishment && !services.supportedPrisonsService) {
      // eslint-disable-next-line no-param-reassign
      sessionData.selectedEstablishment = { ...TestData.prison(), isEnabledForPublic: true }
    }

    req.session = sessionData as Session & Partial<SessionData>

    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(maintenancePageRoute())

  app.use(populateSelectedEstablishment(services))

  app.use('/', indexRoutes(services))
  app.use('/book-a-visit', visitJourneyRoutes(services, 'book'))
  app.use('/update-a-visit', visitJourneyRoutes(services, 'update'))
  app.use('/block-visit-dates', blockVisitDatesRoutes(services))
  app.use('/establishment-not-supported', establishmentNotSupportedRoutes(services))
  app.use('/manage-bookers', bookerManagementRoutes(services))
  app.use('/prisoner', prisonerRoutes(services))
  app.use('/requested-visits', requestRoutes(services))
  app.use('/review', reviewRoutes(services))
  app.use('/search', searchRoutes(services))
  app.use('/timetable', timetableRoutes(services))
  app.use('/visit', visitRoutes(services))
  app.use('/visits', visitsRoutes(services))

  app.use((req, res, next) => next(new NotFound()))

  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
  sessionData = {} as SessionData,
  feComponents = undefined as { sharedData?: HeaderFooterSharedData },
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => PrisonUser
  sessionData?: SessionData
  feComponents?: {
    sharedData?: HeaderFooterSharedData
  }
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, sessionData, feComponents)
}
