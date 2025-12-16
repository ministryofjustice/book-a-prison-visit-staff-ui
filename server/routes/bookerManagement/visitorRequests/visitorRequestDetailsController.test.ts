import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'
import { MoJAlert } from '../../../@types/bapv'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const visitorRequestForReview = TestData.visitorRequestForReview()
const url = `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/link-visitor`
const fakeDateTime = new Date('2025-10-01T09:00')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

  flashData = { errors: [] }
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
  jest.useRealTimers()
})

describe('Booker management - visitor requests - link a visitor', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid visitor request reference', () => {
      return request(app).get('/manage-bookers/visitor-request/INVALID-REQUEST-REFERENCE/link-visitor').expect(400)
    })

    it('should render visitor request details and non-linked contacts, and save data to session', () => {
      bookerService.getVisitorRequestForReview.mockResolvedValue(visitorRequestForReview)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Link a visitor -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe('/manage-bookers')
          expect($('h1').text().trim()).toBe('Link a visitor')

          // Visitor request details
          expect($('[data-test=booker-email]').text()).toBe(visitorRequestForReview.bookerEmail)
          expect($('[data-test=visitor-name]').text()).toBe('Mike Jones')
          expect($('[data-test=visitor-dob]').text()).toBe('10 November 1999')

          // Non-linked visitor list
          expect($('h2').text().trim()).toBe('John Smith’s visitors')
          expect($('[data-test=no-dob-warning]').length).toBe(0)
          expect($('[data-test=no-visitors-warning]').length).toBe(0)
          expect($('input[name=visitorId]').length).toBe(2)
          expect($('[data-test=visitor-1-select] input').val()).toBe('4321')
          expect($('[data-test=visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=visitor-1-dob]').text()).toBe('28 July 1986 (39 years old)')
          expect($('[data-test=visitor-1-last-visit]').text()).toBe('11 October 2025')

          expect($('[data-test=link-visitor]').parent('form').attr('action')).toBe(url)
          expect($('[data-test=link-visitor]').text().trim()).toBe('Confirm')

          expect($('[data-test=check-linked-visitors]').length).toBe(0)

          expect($('input#visitor-none').val()).toBe('none')
          expect($('label[for=visitor-none]').text().trim()).toBe('None of the above')

          expect(bookerService.getVisitorRequestForReview).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
          })

          expect(sessionData.visitorRequest).toStrictEqual(visitorRequestForReview)
        })
    })

    it('should render missing DoB warning', () => {
      bookerService.getVisitorRequestForReview.mockResolvedValue(
        TestData.visitorRequestForReview({
          socialContacts: [TestData.socialContact({ dateOfBirth: null, lastApprovedForVisitDate: null })],
        }),
      )

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Visitor list
          expect($('[data-test=no-dob-warning]').text()).toContain('must have a date of birth')
          expect($('[data-test=no-visitors-warning]').length).toBe(0)
          expect($('[data-test=visitor-1-select] input').length).toBe(0)
          expect($('[data-test=visitor-1-name]').text()).toBe('Jeanette Smith')
          expect($('[data-test=visitor-1-dob]').text()).toBe('Not entered')
          expect($('[data-test=visitor-1-last-visit]').text()).toBe('None')

          expect($('[data-test=link-visitor]').length).toBe(0)
          expect($('[data-test=check-linked-visitors]').attr('href')).toBe(
            `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`,
          )
        })
    })

    it('should render no non-linked visitors warning', () => {
      bookerService.getVisitorRequestForReview.mockResolvedValue(
        TestData.visitorRequestForReview({ socialContacts: [] }),
      )

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Visitor list
          expect($('[data-test=no-dob-warning]').length).toBe(0)
          expect($('[data-test=no-visitors-warning]').text()).toContain('prisoner does not have any visitors')
          expect($('input[name=visitorId]').length).toBe(0)

          expect($('[data-test=link-visitor]').length).toBe(0)
          expect($('[data-test=check-linked-visitors]').attr('href')).toBe(
            `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`,
          )
        })
    })

    it('should render validation errors', () => {
      bookerService.getVisitorRequestForReview.mockResolvedValue(visitorRequestForReview)

      flashData.errors = <FieldValidationError[]>[{ msg: 'Select a visitor to link', path: 'visitorId' }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Link a visitor -/)
          expect($('.govuk-error-summary__body').text()).toContain('Select a visitor to link')
          expect($('#visitorId-error').text()).toContain('Select a visitor to link')
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

    it('should approve request, send audit, set message, clear session and redirect to manage bookers page if visitor selected', () => {
      const approvedVisitorRequest = TestData.visitorRequest()

      bookerService.approveVisitorRequest.mockResolvedValue(approvedVisitorRequest)

      sessionData.visitorRequest = visitorRequestForReview

      return request(app)
        .post(url)
        .send({ visitorId: '4321' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.approveVisitorRequest).toHaveBeenCalledWith({
            username: 'user1',
            requestReference: visitorRequestForReview.reference,
            visitorId: 4321,
          })

          expect(flashProvider).toHaveBeenCalledWith('messages', <MoJAlert>{
            variant: 'success',
            title: 'You approved the request and linked Mike Jones',
            showTitleAsHeading: true,
            html:
              'The booker has been notified by email. ' +
              'You can <a href="/manage-bookers/aaaa-bbbb-cccc/booker-details">view the booker’s account</a>.',
            dismissible: true,
          })

          expect(auditService.approvedVisitorRequest).toHaveBeenCalledWith({
            requestReference: visitorRequestForReview.reference,
            visitorId: '4321',
            username: 'user1',
            operationId: undefined,
          })

          expect(sessionData.visitorRequest).toBeUndefined()
        })
    })

    it('should redirect to check if visitor already linked page if "none" option selected', () => {
      sessionData.visitorRequest = visitorRequestForReview

      return request(app)
        .post(url)
        .send({ visitorId: 'none' })
        .expect(302)
        .expect(
          'location',
          `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/check-linked-visitors`,
        )
        .expect(() => {
          expect(bookerService.approveVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.approvedVisitorRequest).not.toHaveBeenCalled()
          expect(sessionData.visitorRequest.reference).toBe(visitorRequestForReview.reference)
        })
    })

    it('should redirect to manage bookers page if no visitor request details in session', () => {
      return request(app)
        .post(url)
        .send({ visitorId: '1' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.approveVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.approvedVisitorRequest).not.toHaveBeenCalled()
        })
    })

    it('should redirect to manage bookers page if visitor request details in session do not match URL', () => {
      sessionData.visitorRequest = { reference: 'a-different-reference' } as SessionData['visitorRequest']

      return request(app)
        .post(url)
        .send({ visitorId: '1' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.approveVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.approvedVisitorRequest).not.toHaveBeenCalled()
          expect(sessionData.visitorRequest).toBeUndefined()
        })
    })

    it('should redirect to manage bookers page if invalid visitor ID submitted', () => {
      sessionData.visitorRequest = {
        reference: visitorRequestForReview.reference,
        socialContacts: [{ visitorId: 999 }],
      } as SessionData['visitorRequest']

      return request(app)
        .post(url)
        .send({ visitorId: '1' })
        .expect(302)
        .expect('location', '/manage-bookers')
        .expect(() => {
          expect(bookerService.approveVisitorRequest).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
          expect(auditService.approvedVisitorRequest).not.toHaveBeenCalled()
        })
    })

    it('should set validation error if no visitor selected and redirect to original page', () => {
      sessionData.visitorRequest = {
        reference: visitorRequestForReview.reference,
      } as SessionData['visitorRequest']

      return request(app)
        .post(url)
        .send({})
        .expect(302)
        .expect('location', `/manage-bookers/visitor-request/${visitorRequestForReview.reference}/link-visitor`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Select a visitor to link', path: 'visitorId', type: 'field', value: undefined },
          ])
        })
    })
  })
})
