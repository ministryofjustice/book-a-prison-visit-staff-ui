import type { Express } from 'express'
import request from 'supertest'
import { BadRequest, InternalServerError } from 'http-errors'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'
import { requestAlreadyReviewedMessage, requestRejectedMessage } from './visitorRequestMessages'
import { VisitorRequestForReviewDto } from '../../../data/orchestrationApiTypes'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const visitorRequestForReview = TestData.visitorRequestForReview()
const linkedVisitors = [TestData.visitorInfo()]
const url = `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`
const fakeDateTime = new Date('2025-10-01T09:00')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

  flashData = { errors: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {
    visitorRequestJourney: {
      visitorRequest: visitorRequestForReview,
      linkedVisitors,
    },
  } as SessionData

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

    it('should redirect to manage bookers page if no visitor request details in session', () => {
      delete sessionData.visitorRequestJourney
      return request(app).get(url).expect(302).expect('location', '/manage-bookers')
    })

    it('should redirect to manage bookers page if visitor request details in session do not match URL', () => {
      sessionData.visitorRequestJourney.visitorRequest = {
        reference: 'a-different-reference',
      } as VisitorRequestForReviewDto

      return request(app).get(url).expect(302).expect('location', '/manage-bookers')
    })

    it('should render check if visitor already linked page', () => {
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
          expect($('input[name=rejectionReason]').length).toBe(2)
          expect($('[data-test=reject-request]').parent('form').attr('action')).toBe(url)
          expect($('[data-test=reject-request]').text().trim()).toBe('Confirm')
        })
    })

    it('should render validation errors', () => {
      flashData.errors = <FieldValidationError[]>[{ msg: 'Select an answer', path: 'rejectionReason' }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Check if the visitor is already linked -/)
          expect($('.govuk-error-summary__body').text()).toContain('Select an answer')
          expect($('#rejectionReason-error').text()).toContain('Select an answer')
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid visitor request reference', () => {
      return request(app).post('/manage-bookers/visitor-request/INVALID-REQUEST-REFERENCE/link-visitor').expect(400)
    })

    it('should reject request, send audit, set message, clear session and redirect to manage bookers page - REJECT', () => {
      const rejectedVisitorRequest = TestData.visitorRequest()
      bookerService.rejectVisitorRequest.mockResolvedValue(rejectedVisitorRequest)

      return request(app)
        .post(url)
        .send({ rejectionReason: 'REJECT' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'REJECT',
          })

          expect(flashProvider).toHaveBeenCalledWith(
            'messages',
            requestRejectedMessage(visitorRequestForReview, 'REJECT'),
          )

          expect(auditService.rejectedVisitorRequest).toHaveBeenCalledWith({
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'REJECT',
            username: 'user1',
            operationId: undefined,
          })

          expect(sessionData.visitorRequestJourney).toBeUndefined()
        })
    })

    it('should reject request, send audit, set message, clear session and redirect to manage bookers page - ALREADY_LINKED', () => {
      const rejectedVisitorRequest = TestData.visitorRequest()
      bookerService.rejectVisitorRequest.mockResolvedValue(rejectedVisitorRequest)

      return request(app)
        .post(url)
        .send({ rejectionReason: 'ALREADY_LINKED' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'ALREADY_LINKED',
          })

          expect(flashProvider).toHaveBeenCalledWith(
            'messages',
            requestRejectedMessage(visitorRequestForReview, 'ALREADY_LINKED'),
          )

          expect(auditService.rejectedVisitorRequest).toHaveBeenCalledWith({
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'ALREADY_LINKED',
            username: 'user1',
            operationId: undefined,
          })

          expect(sessionData.visitorRequestJourney).toBeUndefined()
        })
    })

    it('should redirect to booker management with message if reject returns HTP 400 (request already reviewed)', () => {
      bookerService.rejectVisitorRequest.mockRejectedValue(new BadRequest())

      return request(app)
        .post(url)
        .send({ rejectionReason: 'REJECT' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'REJECT',
          })

          expect(flashProvider).toHaveBeenCalledWith('messages', requestAlreadyReviewedMessage())

          expect(auditService.rejectedVisitorRequest).toHaveBeenCalledWith({
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'REJECT',
            username: 'user1',
            operationId: undefined,
          })

          expect(sessionData.visitorRequestJourney).toBeUndefined()
        })
    })

    it('should propagate any other API errors', () => {
      bookerService.rejectVisitorRequest.mockRejectedValue(new InternalServerError())

      return request(app)
        .post(url)
        .send({ rejectionReason: 'REJECT' })
        .expect(500)
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
            rejectionReason: 'REJECT',
          })
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.rejectedVisitorRequest).not.toHaveBeenCalled()
          expect(sessionData.visitorRequestJourney).toStrictEqual({
            visitorRequest: visitorRequestForReview,
            linkedVisitors,
          })
        })
    })

    it('should redirect to manage bookers page if no visitor request details in session', () => {
      delete sessionData.visitorRequestJourney
      return request(app)
        .post(url)
        .send({ rejectionReason: 'REJECT' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.rejectedVisitorRequest).not.toHaveBeenCalled()
        })
    })

    it('should redirect to manage bookers page if visitor request details in session do not match URL', () => {
      sessionData.visitorRequestJourney.visitorRequest = {
        reference: 'a-different-reference',
      } as VisitorRequestForReviewDto

      return request(app)
        .post(url)
        .send({ rejectionReason: 'REJECT' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.rejectVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.rejectedVisitorRequest).not.toHaveBeenCalled()
          expect(sessionData.visitorRequestJourney).toBeUndefined()
        })
    })

    it('should set validation error if no rejection reason selected and redirect to original page', () => {
      return request(app)
        .post(url)
        .send({})
        .expect(302)
        .expect(
          'location',
          `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`,
        )
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Select an answer', path: 'rejectionReason', type: 'field', value: undefined },
          ])
        })
    })

    it('should set validation error if invalid rejection reason selected and redirect to original page', () => {
      return request(app)
        .post(url)
        .send({ rejectionReason: 'XYZ' })
        .expect(302)
        .expect(
          'location',
          `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`,
        )
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Select an answer', path: 'rejectionReason', type: 'field', value: 'XYZ' },
          ])
        })
    })
  })
})
