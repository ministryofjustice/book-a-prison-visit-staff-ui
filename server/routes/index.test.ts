import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import config from '../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
  config.features.showReviewBookingsTile = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render the home page cards and change establishment link', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.card').length).toBe(5)

        expect($('[data-test="book-visit"] .card__link').text()).toBe('Book a visit')
        expect($('[data-test="book-visit"] .card__link').attr('href')).toBe('/search/prisoner')

        expect($('[data-test="change-visit"] .card__link').text()).toBe('Change a visit')
        expect($('[data-test="change-visit"] .card__link').attr('href')).toBe('/search/visit')

        expect($('[data-test="need-review"] .card__link').text()).toContain('Need review')
        expect($('[data-test="need-review"] [data-test="need-review-count"]').text()).toBe('10')
        expect($('[data-test="need-review"] .card__link').attr('href')).toBe('/')

        expect($('[data-test="view-visits-by-date"] .card__link').text()).toBe('View visits by date')
        expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toBe('/visits')

        expect($('[data-test="view-timetable"] .card__link').text()).toBe('View visits timetable')
        expect($('[data-test="view-timetable"] .card__link').attr('href')).toBe('/timetable')

        expect($('[data-test="change-establishment"]').text()).toContain('Change establishment')
      })
  })

  it('should not render the review request tab if feature disabled', () => {
    config.features.showReviewBookingsTile = false
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.card').length).toBe(4)

        expect($('[data-test="book-visit"] .card__link').text()).toBe('Book a visit')

        expect($('[data-test="change-visit"] .card__link').text()).toBe('Change a visit')

        expect($('[data-test="need-review"]').length).toBe(0)

        expect($('[data-test="view-visits-by-date"] .card__link').text()).toBe('View visits by date')

        expect($('[data-test="view-timetable"] .card__link').text()).toBe('View visits timetable')
      })
  })
})

describe('GET /back-to-start', () => {
  it('should clear session and redirect to start page', () => {
    jest.spyOn(visitorUtils, 'clearSession')

    return request(app)
      .get('/back-to-start')
      .expect(302)
      .expect('location', '/')
      .expect(res => {
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
