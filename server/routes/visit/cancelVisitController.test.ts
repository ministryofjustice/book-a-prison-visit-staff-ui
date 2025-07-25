import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { FieldValidationError } from 'express-validator'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { CancelVisitOrchestrationDto, Visit } from '../../data/orchestrationApiTypes'
import { CancelledVisitInfo } from '../../@types/bapv'
import TestData from '../testutils/testData'
import { createMockAuditService, createMockVisitService } from '../../services/testutils/mocks'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const visitService = createMockVisitService()

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = <SessionData>{}

  app = appWithAllRoutes({
    services: {
      auditService,
    },
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/:reference/cancelled', () => {
  it('should render the booking cancelled page with details of the visit retrieved from session', () => {
    sessionData.cancelledVisitInfo = {
      startTimestamp: '2022-02-09T10:15:00',
      endTimestamp: '2022-02-09T11:00:00',
      hasEmailAddress: true,
      hasMobileNumber: true,
    }

    return request(app)
      .get('/visit/ab-cd-ef-gh/cancelled')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Booking cancelled')
        expect($('[data-test="visit-details"]').text().trim()).toBe('10:15am to 11am on Wednesday 9 February 2022')
        expect($('[data-test="back-to-start"]').attr('href')).toBe('/back-to-start')
      })
  })

  it('should redirect back to start if no cancelled visit details in session', () => {
    return request(app).get('/visit/ab-cd-ef-gh/cancelled').expect(302).expect('Location', '/back-to-start')
  })
})

describe('GET /visit/:reference/cancel', () => {
  it('should render the cancellation reasons page with all the reasons and none selected', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')
        expect($('input[name="cancel"]').length).toBe(5)
        expect($('input[name="cancel"]:checked').length).toBe(0)
        expect($('[data-test="visitor_cancelled"]').attr('value')).toBe('VISITOR_CANCELLED')
        expect($('label[for="cancel"]').text().trim()).toBe('Visitor cancelled')
        expect($('[data-test="details_changed_after_booking"]').attr('value')).toBe('DETAILS_CHANGED_AFTER_BOOKING')
        expect($('label[for="cancel-4"]').text().trim()).toBe('Details changed after booking')
        expect($('[data-test="administrative_error"]').attr('value')).toBe('ADMINISTRATIVE_ERROR')
        expect($('label[for="cancel-5"]').text().trim()).toBe('Administrative error')

        expect($('input[name="method"]').length).toBe(4)
        expect($('input[name="method"]').eq(0).prop('value')).toBe('PHONE')
        expect($('input[name="method"]').eq(1).prop('value')).toBe('WEBSITE')
        expect($('input[name="method"]').eq(2).prop('value')).toBe('EMAIL')
        expect($('input[name="method"]').eq(3).prop('value')).toBe('IN_PERSON')
        expect($('input[name="method"]:checked').length).toBe(0)

        expect($('[data-test="cancel-booking"]').length).toBe(1)
      })
  })

  it('should render the cancellation reasons page, showing validation errors and re-populating fields', () => {
    flashData.errors = <FieldValidationError[]>[
      { msg: 'No answer selected', path: 'cancel' },
      { msg: 'No request method selected', path: 'method' },
      { msg: 'Enter a reason', path: 'reason' },
    ]

    flashData.formValues = [{ cancel: 'VISITOR_CANCELLED', method: 'EMAIL', reason: 'illness' }]

    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')

        expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
        expect($('.govuk-error-summary__body').text()).toContain('No request method selected')
        expect($('.govuk-error-summary__body').text()).toContain('Enter a reason')
        expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#cancel-error')
        expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#method-error')
        expect($('.govuk-error-summary__body a').eq(2).attr('href')).toBe('#reason-error')

        expect($('input[name="cancel"][value="VISITOR_CANCELLED"]').prop('checked')).toBe(true)
        expect($('input[name="method"][value="EMAIL"]').prop('checked')).toBe(true)
        expect($('input[name="reason"]').val()).toBe('illness')

        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /visit/:reference/cancel', () => {
  let cancelledVisit: Visit

  beforeEach(() => {
    sessionData = <SessionData>{}
    cancelledVisit = TestData.visit()

    visitService.cancelVisit = jest.fn().mockResolvedValue(cancelledVisit)

    app = appWithAllRoutes({
      services: {
        auditService,
        visitService,
      },
      sessionData,
    })
  })

  it('should cancel visit (default method NOT_APPLICABLE), set flash values and redirect to confirmation page', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({ cancel: 'PRISONER_CANCELLED', reason: '  illness  ' })
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancelled')
      .expect(() => {
        expect(visitService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(visitService.cancelVisit).toHaveBeenCalledWith({
          username: 'user1',
          reference: 'ab-cd-ef-gh',
          cancelVisitDto: <CancelVisitOrchestrationDto>{
            cancelOutcome: {
              outcomeStatus: 'PRISONER_CANCELLED',
              text: 'illness',
            },
            applicationMethodType: 'NOT_APPLICABLE',
            actionedBy: 'user1',
            userType: 'STAFF',
          },
        })
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          reason: 'PRISONER_CANCELLED: illness',
          username: 'user1',
          operationId: undefined,
        })
        expect(sessionData.cancelledVisitInfo).toStrictEqual<CancelledVisitInfo>({
          startTimestamp: cancelledVisit.startTimestamp,
          endTimestamp: cancelledVisit.endTimestamp,
          hasEmailAddress: true,
          hasMobileNumber: false,
        })
      })
  })

  it('should capture the request method if VISITOR_CANCELLED', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({ cancel: 'VISITOR_CANCELLED', method: 'EMAIL', reason: '  illness  ' })
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancelled')
      .expect(() => {
        expect(visitService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(visitService.cancelVisit).toHaveBeenCalledWith({
          username: 'user1',
          reference: 'ab-cd-ef-gh',
          cancelVisitDto: <CancelVisitOrchestrationDto>{
            cancelOutcome: {
              outcomeStatus: 'VISITOR_CANCELLED',
              text: 'illness',
            },
            applicationMethodType: 'EMAIL',
            actionedBy: 'user1',
            userType: 'STAFF',
          },
        })
      })
  })

  it('should set validation errors in flash and redirect if no reason selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({})
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', path: 'cancel', type: 'field', value: undefined },
          {
            location: 'body',
            msg: 'Enter a reason for the cancellation',
            path: 'reason',
            type: 'field',
            value: '',
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { reason: '' })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
        expect(sessionData.cancelledVisitInfo).toBeUndefined()
      })
  })

  it('should set validation errors in flash and redirect if VISITOR_CANCELLED and no method selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({ cancel: 'VISITOR_CANCELLED', reason: 'illness' })
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request method selected', path: 'method', type: 'field', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { cancel: 'VISITOR_CANCELLED', reason: 'illness' })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
        expect(sessionData.cancelledVisitInfo).toBeUndefined()
      })
  })

  it('should set validation errors in flash and redirect if no reason text entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({ cancel: 'PRISONER_CANCELLED' })
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Enter a reason for the cancellation',
            path: 'reason',
            type: 'field',
            value: '',
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          cancel: 'PRISONER_CANCELLED',
          reason: '',
        })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
        expect(sessionData.cancelledVisitInfo).toBeUndefined()
      })
  })

  it('should set validation errors in flash and redirect if invalid data entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send({ cancel: 'INVALID_VALUE', reason: 'illness' })
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', path: 'cancel', type: 'field', value: 'INVALID_VALUE' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          cancel: 'INVALID_VALUE',
          reason: 'illness',
        })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
        expect(sessionData.cancelledVisitInfo).toBeUndefined()
      })
  })
})
