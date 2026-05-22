import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockAuditService, createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { setFeature } from '../../data/testutils/mockFeature'

let app: Express

const auditService = createMockAuditService()
const visitService = createMockVisitService()

beforeEach(() => {
  setFeature('printVisitPasses', true)

  app = appWithAllRoutes({ services: { auditService, visitService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Print visit passes by date', () => {
  const date = '2026-05-20'
  const url = `/visit-passes?date=${date}`

  describe(`GET ${url}`, () => {
    it('should return a 404 if the feature is not enabled', () => {
      setFeature('printVisitPasses', false)
      app = appWithAllRoutes({ services: { auditService, visitService } })
      return request(app).get(url).expect(404)
    })

    it('should render visit passes page for given date and selected establishment', () => {
      const visitPasses = [TestData.visitPass()] // TODO add second test visit pass
      visitService.getVisitPasses.mockResolvedValue(visitPasses)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Print visit passes -/)
          expect($('.govuk-back-link').length).toBe(0)
          expect($('h1').text().trim()).toBe('Print visit passes')

          // TODO extend test assertions
        })
    })
  })
})

describe('Print visit pass by visit reference', () => {
  const visitPass = TestData.visitPass()
  const { reference } = visitPass
  const url = `/visit/${reference}/visit-pass`

  describe(`GET ${url}`, () => {
    it('should return a 404 if the feature is not enabled', () => {
      setFeature('printVisitPasses', false)
      app = appWithAllRoutes({ services: { auditService, visitService } })
      return request(app).get(url).expect(404)
    })

    it('should render visit passes page for given visit reference and selected establishment', () => {
      visitService.getVisitPass.mockResolvedValue(visitPass)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Print visit passes -/)
          expect($('.govuk-back-link').length).toBe(0)
          expect($('h1').text().trim()).toBe('Print visit passes')

          // TODO extend test assertions
        })
    })
  })
})
