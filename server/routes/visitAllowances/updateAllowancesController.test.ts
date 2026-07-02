import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../testutils/appSetup'
import { createMockAuditService, createMockVisitAllowanceService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const visitAllowanceService = createMockVisitAllowanceService()

const url = '/visit-allowances/remand'

beforeEach(() => {
  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {} as SessionData
  app = appWithAllRoutes({
    services: { auditService, visitAllowanceService },
    userSupplier: () => ({ ...user }),
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Update visit allowances - change remand visit limit and allowance reset day', () => {
  describe(`GET ${url}`, () => {
    it('should render the form pre-populated with current prison configuration', () => {
      visitAllowanceService.getRemandConfig.mockResolvedValue(TestData.prisonRemandConfig())

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Visit allowances for unconvicted prisoners -/)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('.govuk-back-link').length).toBe(0)
          expect($('.moj-alert').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit allowances for unconvicted prisoners')

          expect($('h2').eq(0).text().trim()).toBe('Unconvicted prisoners')
          expect($('form').attr('action')).toBe(url)
          expect($('input[name=remandVisitLimitPerWeek]').val()).toBe('3')
          expect($('input[name=weekStartDay]').val()).toBe('MONDAY')

          expect(visitAllowanceService.getRemandConfig).toHaveBeenCalledWith({ username: 'user1', prisonId: 'HEI' })
        })
    })

    it('should render validation errors', () => {
      visitAllowanceService.getRemandConfig.mockResolvedValue(TestData.prisonRemandConfig())
      const invalidVisitLimit = 0
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'remandVisitLimitPerWeek',
        value: invalidVisitLimit,
        msg: 'Unconvicted prisoners must be allowed at least 1 visit every 7 days',
      }
      flashData.errors = [validationError]
      flashData.formValues = [{ remandVisitLimitPerWeek: invalidVisitLimit }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href=#remandVisitLimitPerWeek-error]').text()).toBe(validationError.msg)
          expect($('#remandVisitLimitPerWeek-error').text()).toContain(validationError.msg)
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      flashData = { errors: [], formValues: [] }
    })

    it('should update prison config if suitable answers added to form', () => {
      return request(app)
        .post(url)
        .send({ remandVisitLimitPerWeek: '2', weekStartDay: 'THURSDAY' })
        .expect(302)
        .expect('location', `/visit-allowances`)
        .expect(() => {
          expect(visitAllowanceService.updateRemandConfig).toHaveBeenCalledWith({
            prisonId: 'HEI',
            username: 'user1',
            remandVisitLimitPerWeek: 2,
            weekStartDay: 'THURSDAY',
          })
          expect(auditService.updatedPrisonAllowances).toHaveBeenCalledWith({
            prisonId: 'HEI',
            weekStartDay: 'THURSDAY',
            remandVisitLimitPerWeek: 2,
            username: 'user1',
            operationId: undefined,
          })
          expect(sessionData.matchedBookers).toBeUndefined()
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'remandVisitLimitPerWeek',
        value: 0,
        msg: 'Unconvicted prisoners must be allowed at least 1 visit every 7 days',
      }

      return request(app)
        .post(url)
        .send({ remandVisitLimitPerWeek: '0', weekStartDay: 'MONDAY' })
        .expect(302)
        .expect('location', url)
        .expect(() => {
          expect(visitAllowanceService.updateRemandConfig).not.toHaveBeenCalled()
          expect(auditService.updatedPrisonAllowances).not.toHaveBeenCalled()
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            remandVisitLimitPerWeek: 0,
            weekStartDay: 'MONDAY',
          })
        })
    })
  })
})
