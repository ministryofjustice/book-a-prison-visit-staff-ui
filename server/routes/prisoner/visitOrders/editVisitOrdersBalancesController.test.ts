import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'
import { createMockAuditService, createMockVisitOrdersService } from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'
import { setFeature } from '../../../data/testutils/mockFeature'

let app: Express

const auditService = createMockAuditService()
const visitOrdersService = createMockVisitOrdersService()

const prisonerVoBalance = TestData.prisonerVoBalance()
const { prisonerId } = prisonerVoBalance

const url = `/prisoner/${prisonerId}/edit-visiting-orders-balances`

beforeEach(() => {
  setFeature('voAdjustment', { enabled: true })

  visitOrdersService.getVoBalance.mockResolvedValue(prisonerVoBalance)

  app = appWithAllRoutes({ services: { auditService, visitOrdersService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Edit visit order balances', () => {
  describe(`GET ${url}`, () => {
    it('should return a 404 if FEATURE_VO_ADJUSTMENT not enabled', () => {
      setFeature('voAdjustment', { enabled: false })

      app = appWithAllRoutes({ services: { auditService, visitOrdersService } })

      return request(app).get(url).expect(404)
    })

    it('should render edit visiting orders balances page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Edit visiting orders balances -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(`/prisoner/${prisonerId}`)
          expect($('h1').text().trim()).toBe('Edit visiting orders balances')

          // Prisoner and balance details
          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
          expect($('[data-test=vo-balance]').text()).toBe('5')
          expect($('[data-test=pvo-balance]').text()).toBe('2')

          // Form
          expect($('form').attr('action')).toBe(url)
          expect($('input[name=voChange]').length).toBe(3)
          expect($('input[name=voChange][checked]').val()).toBe('NO_CHANGE')
          expect($('input[name=pvoChange]').length).toBe(3)
          expect($('input[name=pvoChange][checked]').val()).toBe('NO_CHANGE')
          expect($('input[name=reason]').length).toBe(5)
          expect($('input[name=reason][checked]').length).toBe(0)
          expect($('[data-test=edit-balance]').text().trim()).toBe('Edit balance')

          expect(visitOrdersService.getVoBalance).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            prisonerId,
          })
        })
    })

    // TODO render validation errors and pre-populate form

    it('should render 400 Bad Request error for invalid prisoner number', () => {
      return request(app).get('/prisoner/A12--34BC/edit-visiting-orders-balances').expect(400)
    })
  })
})
