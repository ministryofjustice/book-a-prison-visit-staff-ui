import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import config from '../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})

  config.features.viewTimetableEnabled = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should hide the View timetable card when feature disabled', () => {
    config.features.viewTimetableEnabled = false
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.card').length).toBe(3)
        expect($('[data-test="view-timetable"]').length).toBe(0)
      })
  })

  it('should render the home page cards and change establishment link', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.card').length).toBe(4)

        expect($('[data-test="book-visit"] .card__link').text()).toBe('Book a visit')
        expect($('[data-test="book-visit"] .card__link').attr('href')).toBe('/search/prisoner')

        expect($('[data-test="change-visit"] .card__link').text()).toBe('Change a visit')
        expect($('[data-test="change-visit"] .card__link').attr('href')).toBe('/search/visit')

        expect($('[data-test="view-visits-by-date"] .card__link').text()).toBe('View visits by date')
        expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toBe('/visits')

        expect($('[data-test="view-timetable"] .card__link').text()).toBe('View visit timetable')
        expect($('[data-test="view-timetable"] .card__link').attr('href')).toBe('/timetable')

        expect($('[data-test="change-establishment"]').text()).toContain('Change establishment')
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
