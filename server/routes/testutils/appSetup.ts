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
import { notificationsApiClientBuilder } from '../../data/notificationsApiClient'
import { prisonerSearchClientBuilder } from '../../data/prisonerSearchClient'
import { prisonApiClientBuilder } from '../../data/prisonApiClient'
import { visitSchedulerApiClientBuilder } from '../../data/visitSchedulerApiClient'
import { whereaboutsApiClientBuilder } from '../../data/whereaboutsApiClient'
import { prisonerContactRegistryApiClientBuilder } from '../../data/prisonerContactRegistryApiClient'
import { prisonRegisterApiClientBuilder } from '../../data/prisonRegisterApiClient'
import PrisonerSearchService from '../../services/prisonerSearchService'
import PrisonerProfileService from '../../services/prisonerProfileService'
import PrisonerVisitorsService from '../../services/prisonerVisitorsService'
import VisitSessionsService from '../../services/visitSessionsService'
import NotificationsService from '../../services/notificationsService'
import SupportedPrisonsService from '../../services/supportedPrisonsService'
import * as auth from '../../authentication/auth'
import { VisitorListItem, VisitSlotList, VisitSessionData } from '../../@types/bapv'
import AuditService from '../../services/auditService'
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

function appSetup({
  prisonerSearchServiceOverride,
  prisonerProfileServiceOverride,
  prisonerVisitorsServiceOverride,
  visitSessionsServiceOverride,
  auditServiceOverride,
  notificationsServiceOverride,
  supportedPrisonsServiceOverride,
  production = false,
  sessionData = {
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
}: {
  prisonerSearchServiceOverride: PrisonerSearchService
  prisonerProfileServiceOverride: PrisonerProfileService
  prisonerVisitorsServiceOverride: PrisonerVisitorsService
  visitSessionsServiceOverride: VisitSessionsService
  auditServiceOverride: AuditService
  notificationsServiceOverride: NotificationsService
  supportedPrisonsServiceOverride: SupportedPrisonsService
  production: boolean
  sessionData: SessionData
}): Express {
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

  const supportedPrisonsService =
    supportedPrisonsServiceOverride ||
    new SupportedPrisonsService(visitSchedulerApiClientBuilder, prisonRegisterApiClientBuilder, null)

  app.use('/', indexRoutes(standardRouter(new MockUserService(), new MockSupportedPrisonsService())))

  const auditService = auditServiceOverride || new AuditService()

  app.use(
    '/change-establishment/',
    establishmentRoutes(
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
      supportedPrisonsService,
      auditService,
      new MockUserService(),
    ),
  )

  const prisonerSearchService =
    prisonerSearchServiceOverride || new PrisonerSearchService(prisonerSearchClientBuilder, null)
  const visitSessionsService =
    visitSessionsServiceOverride ||
    new VisitSessionsService(
      prisonerContactRegistryApiClientBuilder,
      visitSchedulerApiClientBuilder,
      whereaboutsApiClientBuilder,
      null,
    )
  app.use(
    '/search/',
    searchRoutes(
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
      prisonerSearchService,
      visitSessionsService,
      auditService,
    ),
  )

  const prisonerProfileService =
    prisonerProfileServiceOverride ||
    new PrisonerProfileService(
      prisonApiClientBuilder,
      visitSchedulerApiClientBuilder,
      prisonerContactRegistryApiClientBuilder,
      prisonerSearchClientBuilder,
      supportedPrisonsServiceOverride ||
        new SupportedPrisonsService(visitSchedulerApiClientBuilder, prisonRegisterApiClientBuilder, null),
      null,
    )
  app.use(
    '/prisoner/',
    prisonerRoutes(
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
      prisonerProfileService,
      prisonerSearchService,
      visitSessionsService,
      auditService,
    ),
  )

  const prisonerVisitorsService =
    prisonerVisitorsServiceOverride || new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, null)
  const notificationsService = notificationsServiceOverride || new NotificationsService(notificationsApiClientBuilder)
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
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
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
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
    '/visits',
    visitsRoutes(
      standardRouter(new MockUserService(), new MockSupportedPrisonsService()),
      prisonerSearchService,
      visitSessionsService,
      auditService,
    ),
  )

  app.use(
    '/timetable/',
    timetableRoutes(standardRouter(new MockUserService(), new MockSupportedPrisonsService()), visitSessionsService),
  )

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  prisonerSearchServiceOverride,
  prisonerProfileServiceOverride,
  prisonerVisitorsServiceOverride,
  visitSessionsServiceOverride,
  auditServiceOverride,
  notificationsServiceOverride,
  supportedPrisonsServiceOverride,
  production = false,
  sessionData,
}: {
  prisonerSearchServiceOverride?: PrisonerSearchService
  prisonerProfileServiceOverride?: PrisonerProfileService
  prisonerVisitorsServiceOverride?: PrisonerVisitorsService
  visitSessionsServiceOverride?: VisitSessionsService
  auditServiceOverride?: AuditService
  notificationsServiceOverride?: NotificationsService
  supportedPrisonsServiceOverride?: SupportedPrisonsService
  production?: boolean
  sessionData?: SessionData
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup({
    prisonerSearchServiceOverride,
    prisonerProfileServiceOverride,
    prisonerVisitorsServiceOverride,
    visitSessionsServiceOverride,
    auditServiceOverride,
    notificationsServiceOverride,
    supportedPrisonsServiceOverride,
    production,
    sessionData,
  })
}
