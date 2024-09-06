import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockBlockedDatesService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import config from '../../config'

let app: Express

const blockedDatesService = createMockBlockedDatesService()
const prisonExcludeDate = TestData.prisonExcludeDateDto()
const url = '/block-visit-dates'

beforeEach(() => {
  config.features.sessionManagement = true
  app = appWithAllRoutes({ services: { blockedDatesService } })

  blockedDatesService.getFutureExcludeDates.mockResolvedValue([prisonExcludeDate])
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
          expect($('.govuk-back-link').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Block visit dates')
          expect($('[data-test="exclude-date-1"]').text()).toBe(`Thursday 12 December 2024`)
          expect($('[data-test="blocked-by-1"]').text()).toBe(`User one`)
          expect($('[data-test="unblock-date-1"] a').attr('href')).toBe(`/unblock`)
        })
    })
  })
})
