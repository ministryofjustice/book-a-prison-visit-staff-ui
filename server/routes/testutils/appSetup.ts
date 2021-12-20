import express, { Express } from 'express'
import cookieSession from 'cookie-session'
import createError from 'http-errors'
import path from 'path'

import indexRoutes from '../index'
import searchRoutes from '../search'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import standardRouter from '../standardRouter'
import UserService from '../../services/userService'
import { prisonerSearchClientBuilder } from '../../data/prisonerSearchClient'
import PrisonerSearchService from '../../services/prisonerSearchService'
import * as auth from '../../authentication/auth'
import systemToken from '../../data/authClient'
import { SystemToken } from '../../@types/auth'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

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

function appSetup(
  prisonerSearchServiceOverride: PrisonerSearchService,
  systemTokenOverride: SystemToken,
  production = false
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    res.locals = {}
    res.locals.user = req.user
    next()
  })

  app.use(cookieSession({ keys: [''] }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/', indexRoutes(standardRouter(new MockUserService())))

  const systemTokenTest = systemTokenOverride || systemToken
  const prisonerSearchService =
    prisonerSearchServiceOverride || new PrisonerSearchService(prisonerSearchClientBuilder, systemTokenTest)
  app.use('/search/', searchRoutes(standardRouter(new MockUserService()), prisonerSearchService))
  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

export default function appWithAllRoutes(
  prisonerSearchServiceOverride?: PrisonerSearchService,
  systemTokenOverride?: SystemToken,
  production?: boolean
): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(prisonerSearchServiceOverride, systemTokenOverride, production)
}
