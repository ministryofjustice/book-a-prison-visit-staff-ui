import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { createMockVisitAllowanceService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import config from '../../config'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const visitAllowanceService = createMockVisitAllowanceService()

const url = '/visit-allowances'
const prisonIncentiveLevels = [TestData.prisonIncentiveLevel()]

beforeEach(() => {
  flashData = { messages: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  visitAllowanceService.getPrisonIncentiveLevels.mockResolvedValue(prisonIncentiveLevels)
  sessionData = {} as SessionData
  app = appWithAllRoutes({
    services: { visitAllowanceService },
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit allowances - View current visit allowances', () => {
  describe(`GET ${url}`, () => {
    it('should render view visit allowances page with all active incentive levels and alert from update journey', () => {
      flashData.messages = [TestData.mojAlert({ title: 'test alert message' })]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('.moj-alert').length).toBe(1)
          expect($('.moj-alert').text()).toContain('test alert message')
          expect($('title').text()).toMatch(/^Visit allowances -/)
          expect($('h1').text().trim()).toBe('Visit allowances')
          expect($('[data-test=remand-limit]').text()).toBe('3 visits every 7 days')

          // Form
          expect($('form').attr('action')).toBe(url)
          expect($('[data-test=change-allowance]').text().trim()).toBe('Change allowance')

          // Table
          expect($('[data-test=incentive-level-1]').text().trim()).toBe('Standard')
          expect($('[data-test=vo-count-1]').text().trim()).toBe('1 every 14 days')
          expect($('[data-test=pvo-count-1]').text().trim()).toBe('3 every 28 days')

          // Incentives service link
          expect($('a[data-test=incentives-service-url]').attr('href')).toBe(config.dpsIncentives)
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should redirect to the remand prisoner allowances page', () => {
      return request(app).post(url).expect(302).expect('location', `${url}/remand`)
    })
  })
})
