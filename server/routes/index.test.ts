import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import config from '../config'

let app: Express

beforeEach(() => {
  config.features.establishmentSwitcherEnabled = true
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page with change visit tile', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage prison visits')
        expect(res.text).toContain('Book a visit')
        expect(res.text).toContain('Change a visit')
        expect(res.text).toContain('View visits by date')
        expect(res.text).toContain('Change establishment')
      })
  })
  it('should not display change establishment link if feature flag disabled', () => {
    config.features.establishmentSwitcherEnabled = false
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage prison visits')
        expect(res.text).not.toContain('Change establishment')
      })
  })
})

describe('GET /back-to-start', () => {
  it('should clear session and redirect to start page', () => {
    jest.spyOn(visitorUtils, 'clearSession')

    return request(app)
      .get('/back-to-start')
      .expect(302)
      .expect('location', '/')
      .expect(res => {
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
