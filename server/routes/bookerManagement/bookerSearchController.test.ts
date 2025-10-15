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

const url = '/manage-bookers/search'
const urlNoBookerFound = `${url}?no-booker-found`
const booker = TestData.bookerSearchResult()
const inactiveBooker = TestData.bookerSearchResult({ createdTimestamp: '2000-10-09T12:00:00' })

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

describe('Booker management - search for booker by email', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService }, sessionData })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should render booker search page and clear any previously matched bookers from session', () => {
      sessionData.matchedBookers = [booker, inactiveBooker]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Manage online bookers -/)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('.govuk-back-link').length).toBe(0)
          expect($('h1').text().trim()).toBe('Manage online bookers')

          // Form
          expect($('form').attr('action')).toBe(url)
          expect($('input[name=search]').val()).toBeUndefined()
          expect($('[data-test=no-booker-found]').length).toBe(0)
          expect($('[data-test=search]').text().trim()).toBe('Search')

          expect(sessionData.matchedBookers).toBeUndefined()
        })
    })

    it('should render booker search page with search term and message when no results', () => {
      flashData.formValues = [{ search: booker.email }]

      return request(app)
        .get(urlNoBookerFound)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=search]').val()).toBe(booker.email)
          expect($('[data-test=no-booker-found]').text()).toContain('no match')
        })
    })

    it('should render validation errors and pre-populate the form', () => {
      const invalidEmail = 'invalid-email'
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'search',
        value: invalidEmail,
        msg: 'Enter a valid email address',
      }
      flashData.errors = [validationError]
      flashData.formValues = [{ search: invalidEmail }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href=#search-error]').text()).toBe(validationError.msg)
          expect($('#search-error').text()).toContain(validationError.msg)
          expect($('input[name=search]').val()).toBe(invalidEmail)
          expect($('[data-test=no-booker-found]').length).toBe(0)
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

    it('should redirect to booker details page if single booker found', () => {
      sessionData.matchedBookers = [booker, inactiveBooker] // previous match which should be cleared
      bookerService.getSortedBookersByEmail.mockResolvedValue([booker])

      return request(app)
        .post(url)
        .send({ search: booker.email })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/booker-details`)
        .expect(() => {
          expect(bookerService.getSortedBookersByEmail).toHaveBeenCalledWith({ username: 'user1', email: booker.email })
          expect(auditService.bookerSearch).toHaveBeenCalledWith({
            search: booker.email,
            username: 'user1',
            operationId: undefined,
          })
          expect(sessionData.matchedBookers).toBeUndefined()
        })
    })

    it('should save matched bookers to session and redirect to select booker account page if multiple bookers found', () => {
      bookerService.getSortedBookersByEmail.mockResolvedValue([booker, inactiveBooker])

      return request(app)
        .post(url)
        .send({ search: booker.email })
        .expect(302)
        .expect('location', '/manage-bookers/select-account')
        .expect(() => {
          expect(bookerService.getSortedBookersByEmail).toHaveBeenCalledWith({ username: 'user1', email: booker.email })
          expect(auditService.bookerSearch).toHaveBeenCalledWith({
            search: booker.email,
            username: 'user1',
            operationId: undefined,
          })
          expect(sessionData.matchedBookers).toStrictEqual([booker, inactiveBooker])
        })
    })

    it('should redirect back to booker search page with query param if no booker found', () => {
      bookerService.getSortedBookersByEmail.mockResolvedValue([])

      return request(app)
        .post(url)
        .send({ search: booker.email })
        .expect(302)
        .expect('location', urlNoBookerFound)
        .expect(() => {
          expect(bookerService.getSortedBookersByEmail).toHaveBeenCalledWith({ username: 'user1', email: booker.email })
          expect(auditService.bookerSearch).toHaveBeenCalledWith({
            search: booker.email,
            username: 'user1',
            operationId: undefined,
          })
          expect(sessionData.matchedBookers).toBeUndefined()
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'Enter a valid email address',
        path: 'search',
        type: 'field',
        value: 'invalid-email',
      }

      return request(app)
        .post(url)
        .send({ search: 'invalid-email' })
        .expect(302)
        .expect('location', url)
        .expect(() => {
          expect(bookerService.getSortedBookersByEmail).not.toHaveBeenCalled()
          expect(auditService.bookerSearch).not.toHaveBeenCalled()
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { search: 'invalid-email' })
        })
    })
  })
})
