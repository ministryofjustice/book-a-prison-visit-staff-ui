import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import config from '../../config'

let app: Express

beforeEach(() => {
  jest.replaceProperty(config, 'features', { sessionManagement: true })
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Feature flag', () => {
  it('should return a 404 if feature not enabled', () => {
    jest.replaceProperty(config, 'features', { sessionManagement: false })
    app = appWithAllRoutes({})
    return request(app).get('/block-visit-dates').expect(404)
  })
})

describe('Block visit dates listing page', () => {
  describe('GET /block-visit-dates', () => {
    it('should display block visit dates page', () => {
      return request(app)
        .get('/block-visit-dates')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // expect($('.govuk-back-link').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Block visit dates')
        })
    })
  })
})
