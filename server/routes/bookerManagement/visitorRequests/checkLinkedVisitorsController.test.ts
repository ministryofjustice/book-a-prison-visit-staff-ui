import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const visitorRequestForReview = TestData.visitorRequestForReview()
const linkedVisitor = TestData.visitorInfo()
const url = `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`
const fakeDateTime = new Date('2025-10-01T09:00')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

  flashData = { errors: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = { visitorRequest: visitorRequestForReview } as SessionData

  app = appWithAllRoutes({
    services: { auditService, bookerService },
    userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Booker management - visitor requests - check linked visitors', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid visitor request reference', () => {
      return request(app)
        .get('/manage-bookers/visitor-request/INVALID-REQUEST-REFERENCE/check-linked-visitors')
        .expect(400)
    })

    it('should render check if visitor already linked page', () => {
      bookerService.getLinkedVisitors.mockResolvedValue([linkedVisitor])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Check if the visitor is already linked -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(
            `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/link-visitor`,
          )
          expect($('h1').text().trim()).toBe('Check if the visitor is already linked')

          // Visitor request details
          expect($('[data-test=booker-email]').text()).toBe(visitorRequestForReview.bookerEmail)
          expect($('[data-test=visitor-name]').text()).toBe('Mike Jones')
          expect($('[data-test=visitor-dob]').text()).toBe('10 November 1999')

          // Linked visitor list
          expect($('[data-test=visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')

          // Rejection reason form
          expect($('input[name=rejectReason]').length).toBe(2)
          expect($('[data-test=reject-request]').parent('form').attr('action')).toBe(url)
          expect($('[data-test=reject-request]').text().trim()).toBe('Confirm')

          expect(bookerService.getLinkedVisitors).toHaveBeenCalledWith({
            username: 'user1',
            bookerReference: visitorRequestForReview.bookerReference,
            prisonerId: visitorRequestForReview.prisonerId,
          })
        })
    })

    it('should render validation errors', () => {
      bookerService.getLinkedVisitors.mockResolvedValue([linkedVisitor])

      flashData.errors = <FieldValidationError[]>[{ msg: 'Select an answer', path: 'rejectReason' }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Check if the visitor is already linked -/)
          expect($('.govuk-error-summary__body').text()).toContain('Select an answer')
          expect($('#rejectReason-error').text()).toContain('Select an answer')
        })
    })
  })
})
