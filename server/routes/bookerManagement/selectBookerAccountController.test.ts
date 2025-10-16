import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../services/testutils/mocks'
import bapvUserRoles from '../../constants/bapvUserRoles'
import TestData from '../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const url = '/manage-bookers/select-account'
const booker = TestData.bookerSearchResult()
const bookerWithEarlierCreatedDate = TestData.bookerSearchResult({ createdTimestamp: '2000-10-09T12:00:00' })

beforeEach(() => {
  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {} as SessionData
  app = appWithAllRoutes({
    services: { auditService, bookerService },
    userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Booker management - select booker account when multiple options', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService }, sessionData })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should render select booker page when at least 2 accounts present', () => {
      sessionData.matchedBookers = [booker, booker]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Select account to manage -/)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('.govuk-back-link').length).toBe(0)
          expect($('h1').text().trim()).toBe('Select account to manage')

          // Form
          expect($('form').attr('action')).toBe(url)
          expect($('input[name=reference]').val()).toBe(booker.reference)
          expect($('[data-test=continue]').text().trim()).toBe('Continue')
        })
    })

    it('should redirect to previous page, if only 1 booker account present', () => {
      sessionData.matchedBookers = [booker]

      return request(app).get(url).expect(302).expect('location', '/booker-management/search')
    })

    it('should render validation error', () => {
      sessionData.matchedBookers = [booker, booker]
      const missingReference = 'missing-reference'
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'reference',
        value: missingReference,
        msg: 'Select an account to view',
      }
      flashData.errors = [validationError]
      flashData.formValues = [{ reference: missingReference }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href=#reference-error]').text()).toBe(validationError.msg)
          expect($('#reference-error').text()).toContain(validationError.msg)
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      flashData = { errors: [], formValues: [] }
    })

    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService }, sessionData })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it.skip('should navigate to the booker details page, for selected booker account', () => {
      sessionData.matchedBookers = [booker, booker]

      return request(app)
        .post(url)
        .send({ reference: booker.reference })
        .expect(302)
        .expect('location', `/manage-bookers/booker-details/${booker.reference}`)
        .expect(() => {
          // expect(bookerService.getBookersByEmail).toHaveBeenCalledWith({ username: 'user1', email: booker.email })
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'Select an account to view',
        path: 'reference',
        type: 'field',
        value: '',
      }

      return request(app)
        .post(url)
        .send({ reference: '' })
        .expect(302)
        .expect('location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
        })
    })
  })
})
