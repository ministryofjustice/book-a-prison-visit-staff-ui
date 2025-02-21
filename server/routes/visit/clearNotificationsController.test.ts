import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { FlashData } from '../../@types/bapv'
import TestData from '../testutils/testData'
import { createMockAuditService, createMockVisitNotificationsService } from '../../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const visitNotificationsService = createMockVisitNotificationsService()

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    services: {
      auditService,
      visitNotificationsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Clear visit notifications', () => {
  describe('GET /visit/:reference/clear-notifications', () => {
    it('should render the clear notifications page', () => {
      return request(app)
        .get('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Are you sure the visit does not need to be updated or cancelled?')
          expect($('.govuk-back-link').attr('href')).toBe('/visit/ab-cd-ef-gh')
          expect($('input[name="clearNotifications"]').length).toBe(2)
          expect($('input[name="clearNotifications"]:checked').length).toBe(0)
          expect($('input[name="clearReason"]').length).toBe(1)
          expect($('input[name="clearReason"]').val()).toBe(undefined)
          expect($('[data-test="submit"]').length).toBe(1)
        })
    })

    it('should render the clear notifications page, showing validation errors and re-populating fields', () => {
      flashData.errors = [
        { msg: 'No answer selected', path: 'clearNotifications' },
        { msg: 'Enter a reason for not changing the booking', path: 'clearReason' },
      ]

      flashData.formValues = [{ clearNotifications: 'yes', clearReason: 'some text' }]

      return request(app)
        .get('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a reason for not changing the booking')
          expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#clearNotifications-error')
          expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#clearReason-error')

          expect($('input[name="clearNotifications"]:checked').val()).toBe('yes')
          expect($('input[name="clearReason"]').val()).toBe('some text')

          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
        })
    })
  })

  describe('POST /visit/:reference/clear-notifications', () => {
    beforeEach(() => {
      visitNotificationsService.ignoreNotifications.mockResolvedValue(TestData.visit())

      app = appWithAllRoutes({ services: { auditService, visitNotificationsService } })
    })

    it('should clear visit notifications and redirect to the booking summary page if YES and reason given', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=yes')
        .send('clearReason=reason')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()

          expect(visitNotificationsService.ignoreNotifications).toHaveBeenCalledWith({
            username: 'user1',
            reference: 'ab-cd-ef-gh',
            ignoreVisitNotificationsDto: { reason: 'reason', actionedBy: 'user1' },
          })

          expect(auditService.dismissedNotifications).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            reason: 'reason',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should NOT clear visit notifications and redirect to the booking summary page if NO selected', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=no')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })

    it('should set validation errors in flash and redirect to self if no reason selected', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/clear-notifications')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'No answer selected',
              path: 'clearNotifications',
              type: 'field',
              value: undefined,
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })

    it('should set validation errors in flash and redirect to self if YES selected and no reason given', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=yes')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/clear-notifications')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter a reason for not changing the booking',
              path: 'clearReason',
              type: 'field',
              value: '',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { clearNotifications: 'yes', clearReason: '' })
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })
  })
})
