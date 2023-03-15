/* eslint-disable max-classes-per-file */
import express, { Express } from 'express'
import createError from 'http-errors'
import { Cookie, SessionData } from 'express-session'

import indexRoutes from '../index'
import bookAVisitRoutes from '../bookAVisit'
import establishmentRoutes from '../changeEstablishment'
import prisonerRoutes from '../prisoner'
import searchRoutes from '../search'
import timetableRoutes from '../timetable'
import visitRoutes from '../visit'
import visitsRoutes from '../visits'

import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import setUpCurrentUser from '../../middleware/setUpCurrentUser'
import type { Services } from '../../services'

import UserService from '../../services/userService'
import SupportedPrisonsService from '../../services/supportedPrisonsService'
import { VisitorListItem, VisitSlotList, VisitSessionData } from '../../@types/bapv'
import TestData from './testData'

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
  app.use(setUpCurrentUser(services))

  app.use('/', indexRoutes())
  app.use('/book-a-visit', bookAVisitRoutes(services))
  app.use('/change-establishment', establishmentRoutes(services))
  app.use('/prisoner', prisonerRoutes(services))
  app.use('/search', searchRoutes(services))
  app.use('/timetable', timetableRoutes(services))
  app.use('/visit', visitRoutes(services))
  app.use('/visits', visitsRoutes(services))

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
