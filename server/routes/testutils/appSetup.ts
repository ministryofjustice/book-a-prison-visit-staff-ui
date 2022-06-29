import express, { Express } from 'express'
import createError from 'http-errors'
import { Cookie, SessionData } from 'express-session'
import indexRoutes from '../index'
import searchRoutes from '../search'
import prisonerRoutes from '../prisoner'
import bookAVisitRoutes from '../bookAVisit'
import visitRoutes from '../visit'
import visitsRoutes from '../visits'
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
import PrisonerSearchService from '../../services/prisonerSearchService'
import PrisonerProfileService from '../../services/prisonerProfileService'
import PrisonerVisitorsService from '../../services/prisonerVisitorsService'
import VisitSessionsService from '../../services/visitSessionsService'
import NotificationsService from '../../services/notificationsService'
import * as auth from '../../authentication/auth'
import systemToken from '../../data/authClient'
import { SystemToken, VisitorListItem, VisitSlotList, VisitSessionData } from '../../@types/bapv'
import AuditService from '../../services/auditService'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

export const flashProvider = jest.fn()

class MockUserService extends UserService {
  constructor() {
    super(undefined)
  }

  async getUser(token: string) {
    return {
      token,
      ...user,
    }
  }
}

function appSetup({
  prisonerSearchServiceOverride,
  prisonerProfileServiceOverride,
  prisonerVisitorsServiceOverride,
  visitSessionsServiceOverride,
  auditServiceOverride,
  systemTokenOverride,
  production = false,
  sessionData = {
    cookie: new Cookie(),
    returnTo: '',
    nowInMinutes: 0,
    visitorList: { visitors: [] as VisitorListItem[] },
    adultVisitors: { adults: [] as VisitorListItem[] },
    slotsList: {} as VisitSlotList,
    timeOfDay: '',
    dayOfTheWeek: '',
    visitSessionData: {} as VisitSessionData,
    availableSupportTypes: [],
  },
}: {
  prisonerSearchServiceOverride: PrisonerSearchService
  prisonerProfileServiceOverride: PrisonerProfileService
  prisonerVisitorsServiceOverride: PrisonerVisitorsService
  visitSessionsServiceOverride: VisitSessionsService
  auditServiceOverride: AuditService
  systemTokenOverride: SystemToken
  production: boolean
  sessionData: SessionData
}): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app)

  app.use((req, res, next) => {
    res.locals = {}
    res.locals.user = req.user
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
  app.use('/', indexRoutes(standardRouter(new MockUserService())))

  const systemTokenTest = systemTokenOverride || systemToken
  const prisonerSearchService =
    prisonerSearchServiceOverride || new PrisonerSearchService(prisonerSearchClientBuilder, systemTokenTest)
  const visitSessionsService =
    visitSessionsServiceOverride ||
    new VisitSessionsService(
      prisonerContactRegistryApiClientBuilder,
      visitSchedulerApiClientBuilder,
      whereaboutsApiClientBuilder,
      systemTokenTest,
    )
  const auditService = auditServiceOverride || new AuditService()
  app.use(
    '/search/',
    searchRoutes(standardRouter(new MockUserService()), prisonerSearchService, visitSessionsService, auditService),
  )

  const prisonerProfileService =
    prisonerProfileServiceOverride ||
    new PrisonerProfileService(
      prisonApiClientBuilder,
      visitSchedulerApiClientBuilder,
      prisonerContactRegistryApiClientBuilder,
      systemTokenTest,
    )
  app.use(
    '/prisoner/',
    prisonerRoutes(
      standardRouter(new MockUserService()),
      prisonerProfileService,
      prisonerSearchService,
      visitSessionsService,
    ),
  )

  const prisonerVisitorsService =
    prisonerVisitorsServiceOverride ||
    new PrisonerVisitorsService(prisonerContactRegistryApiClientBuilder, systemTokenTest)
  const notificationsService = new NotificationsService(notificationsApiClientBuilder)
  app.use(
    '/book-a-visit/',
    bookAVisitRoutes(
      standardRouter(new MockUserService()),
      prisonerVisitorsService,
      visitSessionsService,
      prisonerProfileService,
      notificationsService,
    ),
  )
  app.use('/visit/', visitRoutes(standardRouter(new MockUserService()), prisonerSearchService, visitSessionsService))
  app.use('/visits', visitsRoutes(standardRouter(new MockUserService()), prisonerSearchService, visitSessionsService))

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
  systemTokenOverride,
  production = false,
  sessionData,
}: {
  prisonerSearchServiceOverride?: PrisonerSearchService
  prisonerProfileServiceOverride?: PrisonerProfileService
  prisonerVisitorsServiceOverride?: PrisonerVisitorsService
  visitSessionsServiceOverride?: VisitSessionsService
  auditServiceOverride?: AuditService
  systemTokenOverride?: SystemToken
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
    systemTokenOverride,
    production,
    sessionData,
  })
}
