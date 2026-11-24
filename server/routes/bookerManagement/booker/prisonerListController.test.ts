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

const prisoner1 = TestData.bookerPrisoner()
const prisoner2 = TestData.bookerPrisoner({
  prisonerNumber: 'B9876CD',
  firstName: 'JACK',
  lastName: 'Williams',
  dateOfBirth: '1990-01-01',
})
const registeredPrison = TestData.bookerPrisonerRegisteredPrison()
const permittedVisitors = [TestData.bookerPrisonerVisitor()]
const booker = TestData.bookerDetailedInfo({
  permittedPrisoners: [
    { prisoner: prisoner1, registeredPrison, permittedVisitors },
    { prisoner: prisoner2, registeredPrison, permittedVisitors },
  ],
})

const url = `/manage-bookers/${booker.reference}/prisoner`
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

describe('Booker management - prisoner list', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid booker reference', () => {
      return request(app).get(`/manage-bookers/INVALID-BOOKER-REFERENCE/prisoner`).expect(400)
    })

    it('should reject an incorrect (but valid) booker reference', () => {
      return request(app).get(`/manage-bookers/zzzz-qqqq-wwww/prisoner`).expect(400)
    })

    it('should render all prisoners linked to booker account', () => {
      sessionData.selectedBooker = booker.reference
      bookerService.getBookerDetails.mockResolvedValue(booker)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Select a prisoner -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(`/manage-bookers/${booker.reference}/booker-details`)
          expect($('h1').text().trim()).toBe('Select a prisoner')

          // Prisoner list
          expect($('[data-test=prisoner-1-select] input').val()).toBe('A1234BC')
          expect($('[data-test=prisoner-1-prisoner-name]').text().trim()).toBe('John Smith')
          expect($('[data-test=prisoner-1-prison-number]').text().trim()).toBe('A1234BC')
          expect($('[data-test=prisoner-1-dob]').text()).toContain('2 April 1975')

          expect($('[data-test=prisoner-2-select] input').val()).toBe('B9876CD')
          expect($('[data-test=prisoner-2-prisoner-name]').text().trim()).toBe('Jack Williams')
          expect($('[data-test=prisoner-2-prison-number]').text().trim()).toBe('B9876CD')
          expect($('[data-test=prisoner-2-dob]').text()).toContain('1 January 1990')

          expect($('[data-test=continue-button]').parent('form').attr('action')).toBe(
            `/manage-bookers/${booker.reference}/prisoner`,
          )
          expect($('[data-test=continue-button]').text().trim()).toBe('Continue')

          expect(bookerService.getBookerDetails).toHaveBeenCalledWith({
            reference: booker.reference,
          })
        })
    })

    it('should render validation errors', () => {
      sessionData.selectedBooker = booker.reference
      bookerService.getBookerDetails.mockResolvedValue(booker)

      flashData.errors = <FieldValidationError[]>[{ msg: 'Select a prisoner', path: 'prisonNumber' }]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Select a prisoner -/)
          expect($('.govuk-error-summary__body').text()).toContain('Select a prisoner')
          expect($('#prisonNumber-error').text()).toContain('Select a prisoner')
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid booker reference', () => {
      return request(app).post(`/manage-bookers/INVALID-BOOKER-REFERENCE/prisoner`).expect(400)
    })

    it('should reject an incorrect (but valid) booker reference', () => {
      return request(app).post(`/manage-bookers/zzzz-qqqq-wwww/prisoner`).expect(400)
    })

    it('should redirect to visitor page for selected prisoner', () => {
      sessionData.selectedBooker = booker.reference
      return request(app)
        .post(url)
        .send({ prisonNumber: 'A1234BC' })
        .expect(302)
        .expect('location', '/manage-bookers/aaaa-bbbb-cccc/prisoner/A1234BC/link-visitor')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    it('should set validation error if no prisoner selected and redirect to original page', () => {
      sessionData.selectedBooker = booker.reference
      return request(app)
        .post(url)
        .send({})
        .expect(302)
        .expect('location', '/manage-bookers/aaaa-bbbb-cccc/prisoner')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Select a prisoner',
              path: 'prisonNumber',
              type: 'field',
              value: undefined,
            },
          ])
        })
    })
  })
})
