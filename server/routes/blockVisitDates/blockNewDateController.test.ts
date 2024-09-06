import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitService } from '../../services/testutils/mocks'
import config from '../../config'

let app: Express
let sessionData: SessionData

const visitService = createMockVisitService()

const url = '/block-visit-dates/block-new-date'

beforeEach(() => {
  jest.replaceProperty(config, 'features', { sessionManagement: true })

  sessionData = {} as SessionData
  app = appWithAllRoutes({ services: { visitService }, sessionData })
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
      return request(app).get(url).expect(302).expect('location', '/block-visit-dates')
    })

    it('should display block new date page - with one existing booking', () => {
      sessionData.visitBlockDate = '2024-09-06'
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
      sessionData.visitBlockDate = '2024-09-06'
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
      sessionData.visitBlockDate = '2024-09-06'
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
})
