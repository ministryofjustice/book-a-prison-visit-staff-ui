import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider } from '../../testutils/appSetup'
import {
  createMockAuditService,
  createMockBlockDatesOrSessionsService,
  createMockVisitService,
} from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'
import { VisitPreview } from '../../../data/orchestrationApiTypes'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const blockDatesOrSessionsService = createMockBlockDatesOrSessionsService()
const visitService = createMockVisitService()

const url = '/block-visit-dates/block-new-session/confirm'
const date = '2024-09-06'

const selectedSession = TestData.sessionSchedule({
  sessionTemplateReference: 'session-1',
  sessionTimeSlot: { startTime: '10:00', endTime: '11:00' },
})

beforeEach(() => {
  sessionData = {
    blockDateOrSession: { date, backLinkHref: '#back-link-from-session', sessions: [selectedSession], selectedSession },
  } as SessionData

  visitService.getVisitsBySessionTemplate.mockResolvedValue([])

  app = appWithAllRoutes({ services: { auditService, blockDatesOrSessionsService, visitService }, sessionData })

  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Confirm session block', () => {
  describe(`GET ${url}`, () => {
    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.blockDateOrSession = undefined
      return request(app).get(url).expect(302).expect('location', '/block-visit-dates')
    })

    it('should display confirm session block page - no existing visits', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toBe('/block-visit-dates/block-new-session/choose')
          expect($('h1').text()).toBe(
            'Are you sure you want to block visits for this session on Friday 6 September 2024?',
          )

          expect($('[data-test=session-details]').text()).toBe('10am to 11am, All prisoners')

          expect($('[data-test=no-existing-bookings]').length).toBe(1)
          expect($('[data-test=existing-bookings]').length).toBe(0)

          expect($('form[action="/block-visit-dates/block-new-session/confirm"][method=POST]').length).toBe(1)
          expect($('input[name=confirmBlockSession]').length).toBe(2)
          expect($('input[name=confirmBlockSession]:checked').length).toBe(0)

          expect($('[data-test=submit]').text().trim()).toBe('Continue')
        })
        .expect(() => {
          expect(sessionData.blockDateOrSession.backLinkHref).toBe('/block-visit-dates/block-new-session/choose')

          expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            reference: selectedSession.sessionTemplateReference,
            sessionDate: date,
          })
        })
    })

    it('should display confirm session block page - 1 existing visit', () => {
      visitService.getVisitsBySessionTemplate.mockResolvedValue([{} as VisitPreview])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=existing-bookings]').text().trim()).toBe('There is 1 existing booking for this session.')
          expect($('[data-test=no-existing-bookings]').length).toBe(0)
        })
    })

    it('should display confirm session block page - multiple existing visits', () => {
      visitService.getVisitsBySessionTemplate.mockResolvedValue([{} as VisitPreview, {} as VisitPreview])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=existing-bookings]').text().trim()).toBe(
            'There are 2 existing bookings for this session.',
          )
          expect($('[data-test=no-existing-bookings]').length).toBe(0)
        })
    })

    it('should render validation errors', () => {
      const validationError = { path: 'confirmBlockSession', msg: 'No answer selected' } as FieldValidationError

      flashData = { errors: [validationError] }

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#confirmBlockSession-error"]').text()).toBe(validationError.msg)
          expect($('#confirmBlockSession-error').text()).toContain(validationError.msg)
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.blockDateOrSession = undefined
      return request(app).post(url).expect(302).expect('location', '/block-visit-dates')
    })

    it('should block selected session for date and redirect to block visit dates or sessions page if confirmed', () => {
      blockDatesOrSessionsService.blockVisitSession.mockResolvedValue()

      return request(app)
        .post(url)
        .send({ confirmBlockSession: 'yes' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.blockVisitSession).toHaveBeenCalledWith({
            sessionTemplateReference: selectedSession.sessionTemplateReference,
            date,
            username: 'user1',
          })

          expect(auditService.blockedVisitSession).toHaveBeenCalledWith({
            date,
            sessionReference: selectedSession.sessionTemplateReference,
            username: 'user1',
            operationId: undefined,
          })

          expect(flashProvider).toHaveBeenCalledTimes(1)
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'success',
            title: 'Visit session blocked for date',
            html: 'Visits are blocked on Friday 6 September 2024 for 10am to 11am,<br>All prisoners',
          })
          expect(sessionData.blockDateOrSession).toBe(undefined)
        })
    })

    it('should NOT block selected session for date and redirect to block visit dates or sessions page if NOT confirmed', () => {
      return request(app)
        .post(url)
        .send({ confirmBlockSession: 'no' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.blockVisitSession).not.toHaveBeenCalled()
          expect(auditService.blockedVisitSession).not.toHaveBeenCalled()
          expect(flashProvider).toHaveBeenCalledTimes(0)
          expect(sessionData.blockDateOrSession).toBe(undefined)
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'confirmBlockSession',
        type: 'field',
        value: 'invalid',
      }

      return request(app)
        .post(url)
        .send({ confirmBlockSession: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates/block-new-session/confirm')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })
  })
})
