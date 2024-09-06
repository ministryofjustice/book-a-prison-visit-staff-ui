import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import config from '../../config'

let app: Express

const url = '/block-visit-dates'

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
    return request(app).get(url).expect(404)
  })
})

describe('Block visit dates listing page', () => {
  describe(`GET ${url}`, () => {
    it('should display block visit dates page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // expect($('.govuk-back-link').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Block visit dates')
        })
    })
  })
})
