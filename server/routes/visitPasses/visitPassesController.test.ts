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
  const url = `/visit-passes?date=${date}&from=visits&query=back-link-query`

  describe(`GET ${url}`, () => {
    it('should return a 404 if the feature is not enabled', () => {
      setFeature('printVisitPasses', false)
      app = appWithAllRoutes({ services: { auditService, visitService } })
      return request(app).get(url).expect(404)
    })

    it('should render visit passes page for given date and selected establishment', () => {
      const visitPasses = [TestData.visitPassDto()] // TODO add second test visit pass
      visitService.getVisitPasses.mockResolvedValue(visitPasses)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Print visit passes -/)
          expect($('.govuk-back-link').attr('href')).toBe(`/visits?back-link-query`)
          expect($('h1').eq(0).text().trim()).toBe('Print visit passes')
          expect($('[data-test="print-all"]').length).toBe(1)

          // TODO extend test assertions

          expect($('[data-test="no-visit-passes"]').length).toBe(0)
        })
    })

    it('should show message and no print button if no passes to print', () => {
      visitService.getVisitPasses.mockResolvedValue([])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').eq(0).text().trim()).toBe('Print visit passes')
          expect($('[data-test="print-all"]').length).toBe(0)
          expect($('[data-test="no-visit-passes"]').length).toBe(1)
        })
    })
  })
})

describe('Print visit pass by visit reference', () => {
  const visitPass = TestData.visitPassDto()
  const { reference } = visitPass
  const url = `/visit/${reference}/visit-pass?from=visit`

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
          expect($('title').text()).toMatch(/^Print visit pass -/)
          expect($('.govuk-back-link').attr('href')).toBe(`/visit/${reference}`)
          expect($('h1').eq(0).text().trim()).toBe('Print visit pass')
          expect($('[data-test="print-all"]').length).toBe(1)

          // TODO extend test assertions

          expect($('[data-test="no-visit-passes"]').length).toBe(0)
        })
    })
  })
})
