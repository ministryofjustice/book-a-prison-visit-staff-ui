/* eslint-disable max-classes-per-file */
import express, { Express } from 'express'
import createError from 'http-errors'
import { Cookie, SessionData } from 'express-session'
import indexRoutes from '../index'
import searchRoutes from '../search'
import establishmentRoutes from '../changeEstablishment'
import prisonerRoutes from '../prisoner'
import bookAVisitRoutes from '../bookAVisit'
import visitRoutes from '../visit'
import visitsRoutes from '../visits'
import timetableRoutes from '../timetable'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import standardRouter from '../standardRouter'
import UserService from '../../services/userService'
import SupportedPrisonsService from '../../services/supportedPrisonsService'
import * as auth from '../../authentication/auth'
import { VisitorListItem, VisitSlotList, VisitSessionData } from '../../@types/bapv'
import TestData from './testData'
import type { Services } from '../../services'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
  activeCaseLoadId: 'HEI',
}

export const flashProvider = jest.fn()

class MockUserService extends UserService {
  constructor() {
    super(undefined, undefined)
  }

  async getUser(token: string) {
    return {
      token,
      ...user,
    }
  }

  async setActiveCaseLoad(_caseLoadId: string, _username: string) {
    return Promise.resolve()
  }

  async getUserCaseLoadIds(_username: string): Promise<string[]> {
    return TestData.supportedPrisonIds()
  }
}

class MockSupportedPrisonsService extends SupportedPrisonsService {
  constructor() {
    super(undefined, undefined, undefined)
  }

  async getSupportedPrisons(_username: string): Promise<Record<string, string>> {
    return TestData.supportedPrisons()
  }
}

function appSetup(
  services: Services,
  production: boolean,
  sessionData: SessionData = {
    cookie: new Cookie(),
    returnTo: '',
    nowInMinutes: 0,
    availableSupportTypes: [],
    visitorList: { visitors: [] as VisitorListItem[] },
    adultVisitors: { adults: [] as VisitorListItem[] },
    slotsList: {} as VisitSlotList,
    visitSessionData: {} as VisitSessionData,
    selectedEstablishment: undefined,
  },
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app)

  app.use((req, res, next) => {
    res.locals = {}
    res.locals.user = user
    req.flash = flashProvider
    req.session = {
      ...sessionData,
      regenerate: jest.fn(),
      destroy: jest.fn(),
      reload: jest.fn(),
      id: 'sessionId',
      resetMaxAge: jest.fn(),
      save: jest.fn(),
      touch: jest.fn(),
    }
    next()
  })

  // app.use(cookieSession({ keys: [''] }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (services.userService === undefined) {
    // eslint-disable-next-line no-param-reassign
    services.userService = new MockUserService()
  }
  if (services.supportedPrisonsService === undefined) {
    // eslint-disable-next-line no-param-reassign
    services.supportedPrisonsService = new MockSupportedPrisonsService()
  }

  app.use('/', indexRoutes(standardRouter(services)))
  app.use('/book-a-visit/', bookAVisitRoutes(standardRouter(services), services))
  app.use('/change-establishment/', establishmentRoutes(standardRouter(services), services))
  app.use('/prisoner/', prisonerRoutes(standardRouter(services), services))
  app.use('/search/', searchRoutes(standardRouter(services), services))
  app.use('/timetable/', timetableRoutes(standardRouter(services), services))
  app.use('/visit/', visitRoutes(standardRouter(services), services))
  app.use('/visits', visitsRoutes(standardRouter(services), services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  sessionData,
}: {
  production?: boolean
  services?: Partial<Services>
  sessionData?: SessionData
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, sessionData)
}
