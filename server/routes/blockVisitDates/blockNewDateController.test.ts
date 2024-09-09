import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBlockedDatesService, createMockVisitService } from '../../services/testutils/mocks'
import config from '../../config'
import { FlashData } from '../../@types/bapv'

let app: Express
let sessionData: SessionData

const blockedDatesService = createMockBlockedDatesService()
const visitService = createMockVisitService()

const url = '/block-visit-dates/block-new-date'
const visitBlockDate = '2024-09-06'

beforeEach(() => {
  jest.replaceProperty(config, 'features', { sessionManagement: true })

  sessionData = { visitBlockDate } as SessionData
  app = appWithAllRoutes({ services: { blockedDatesService, visitService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Feature flag', () => {
  it('should return a 404 if feature not enabled', () => {
    jest.replaceProperty(config, 'features', { sessionManagement: false })
    app = appWithAllRoutes({})
    return request(app).get(url).expect(404)
  })
})

describe('Block new visit date', () => {
  describe(`GET ${url}`, () => {
    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.visitBlockDate = undefined
      return request(app).get(url).expect(302).expect('location', '/block-visit-dates')
    })

    it('should display block new date page - with one existing booking', () => {
      visitService.getBookedVisitCountByDate.mockResolvedValue(1)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toBe('/block-visit-dates')
          expect($('h1').text()).toBe('Are you sure you want to block visits on Friday 6 September 2024?')

          expect($('[data-test=existing-bookings]').text().trim()).toBe('There is 1 existing booking for this date.')
          expect($('[data-test=no-existing-bookings]').length).toBe(0)

          expect($('input[name=confirmBlockDate]').length).toBe(2)
          expect($('input[name=confirmBlockDate]:checked').length).toBe(0)

          expect($('[data-test=submit]').text().trim()).toBe('Continue')

          expect(visitService.getBookedVisitCountByDate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            date: sessionData.visitBlockDate,
          })
        })
    })

    it('should display block new date page - with multiple existing bookings', () => {
      visitService.getBookedVisitCountByDate.mockResolvedValue(2)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=existing-bookings]').text().trim()).toBe('There are 2 existing bookings for this date.')
          expect($('[data-test=no-existing-bookings]').length).toBe(0)
        })
    })

    it('should display block new date page - with no existing bookings', () => {
      visitService.getBookedVisitCountByDate.mockResolvedValue(0)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=existing-bookings]').length).toBe(0)
          expect($('[data-test=no-existing-bookings]').text()).toBe('There are no existing bookings for this date.')
        })
    })
  })

  describe(`POST ${url}`, () => {
    let flashData: FlashData
    const blockedDateSuccessMessage = 'Visits are blocked for Friday 6 September 2024.'

    beforeEach(() => {
      flashData = { errors: [], formValues: [] }
      flashProvider.mockImplementation((key: keyof FlashData) => {
        return flashData[key]
      })
    })

    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.visitBlockDate = undefined
      return request(app).post(url).expect(302).expect('location', '/block-visit-dates')
    })

    it('should block date set, remove date from session, and redirect to blocked dates listing page if block confirmed', () => {
      blockedDatesService.blockVisitDate.mockResolvedValue()

      return request(app)
        .post(url)
        .send({ confirmBlockDate: 'yes' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockedDatesService.blockVisitDate).toHaveBeenCalledWith('user1', 'HEI', visitBlockDate)
          expect(flashProvider).toHaveBeenCalledTimes(1)
          expect(flashProvider).toHaveBeenCalledWith('message', blockedDateSuccessMessage)
          expect(sessionData.visitBlockDate).toBe(undefined)
        })
    })

    it('should not block date, and redirect to blocked dates listing page if block not confirmed', () => {
      return request(app)
        .post(url)
        .send({ confirmBlockDate: 'no' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockedDatesService.blockVisitDate).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'confirmBlockDate',
        type: 'field',
        value: 'invalid',
      }

      return request(app)
        .post(url)
        .send({ confirmBlockDate: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates/block-new-date')
        .expect(() => {
          expect(blockedDatesService.blockVisitDate).not.toHaveBeenCalled()
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })
  })
})
