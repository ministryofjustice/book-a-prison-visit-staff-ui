/* eslint-disable import/first */
/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/order
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import express, { Express } from 'express'
import { NotFound } from 'http-errors'
import { Session, SessionData } from 'express-session'
import HeaderFooterMeta from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterMeta'

import indexRoutes from '../index'
import bookAVisitRoutes from '../bookAVisit'
import blockVisitDatesRoutes from '../blockVisitDates'
import establishmentNotSupportedRoutes from '../establishmentNotSupported'
import prisonerRoutes from '../prisoner'
import reviewRoutes from '../review'
import searchRoutes from '../search'
import timetableRoutes from '../timetable'
import visitRoutes from '../visit'
import visitsRoutes from '../visits'

import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import populateSelectedEstablishment from '../../middleware/populateSelectedEstablishment'
import type { Services } from '../../services'

import SupportedPrisonsService from '../../services/supportedPrisonsService'
import TestData from './testData'
import { Prison } from '../../@types/bapv'
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

export const flashProvider = jest.fn()

class MockSupportedPrisonsService extends SupportedPrisonsService {
  constructor() {
    super(undefined, undefined, undefined)
  }

  async getSupportedPrisons(_username: string): Promise<Record<string, string>> {
    return TestData.supportedPrisons()
  }

  async getPrison(_username: string, _prisonCode: string): Promise<Prison> {
    return TestData.prison()
  }
}

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => PrisonUser,
  sessionData: SessionData,
  feComponentsMeta: HeaderFooterMeta,
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user } as PrisonUser,
      feComponentsMeta,
    }
    req.session = sessionData as Session & Partial<SessionData>
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(populateSelectedEstablishment({ supportedPrisonsService: new MockSupportedPrisonsService(), ...services }))

  app.use('/', indexRoutes(services))
  app.use('/book-a-visit', bookAVisitRoutes(services))
  app.use('/block-visit-dates', blockVisitDatesRoutes(services))
  app.use('/establishment-not-supported', establishmentNotSupportedRoutes(services))
  app.use('/prisoner', prisonerRoutes(services))
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
  feComponentsMeta = undefined as HeaderFooterMeta,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => PrisonUser
  sessionData?: SessionData
  feComponentsMeta?: HeaderFooterMeta
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, sessionData, feComponentsMeta)
}
