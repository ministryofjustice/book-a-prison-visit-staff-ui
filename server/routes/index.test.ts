import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import { createMockVisitNotificationsService } from '../services/testutils/mocks'
import TestData from './testutils/testData'
import config from '../config'

let app: Express

const visitNotificationsService = createMockVisitNotificationsService()

beforeEach(() => {
  app = appWithAllRoutes({ services: { visitNotificationsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  let notificationCount = TestData.notificationCount()

  beforeEach(() => {
    visitNotificationsService.getNotificationCount.mockResolvedValue(notificationCount)
  })

  it('should render the home page cards and change establishment link', () => {
    config.features.sessionManagement = true
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.card').length).toBe(5)

        expect($('[data-test="book-or-change-visit"] .card__link').text()).toBe('Book or change a visit')
        expect($('[data-test="book-or-change-visit"] .card__link').attr('href')).toBe('/search/prisoner')

        expect($('[data-test="need-review"] .card__link').text()).toContain('Need review')
        expect($('[data-test="need-review"] .card__link').attr('href')).toBe('/review')

        expect($('[data-test="view-visits-by-date"] .card__link').text()).toBe('View visits by date')
        expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toBe('/visits')

        expect($('[data-test="view-timetable"] .card__link').text()).toBe('View visits timetable')
        expect($('[data-test="view-timetable"] .card__link').attr('href')).toBe('/timetable')

        expect($('[data-test="block-dates"] .card__link').text()).toBe('Block visit dates')
        expect($('[data-test="block-dates"] .card__link').attr('href')).toBe('/block-visit-dates')

        expect($('[data-test="change-establishment"]').text()).toContain('Change establishment')
      })
  })

  it('should not render the block-dates card if feature is disabled', () => {
    config.features.sessionManagement = false
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.card').length).toBe(4)
        expect($('[data-test="block-dates"] .card__link').length).toBe(0)
      })
  })

  describe('Need review tile', () => {
    it('should render badge with review count', () => {
      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="need-review-count"]').text()).toBe(notificationCount.count.toString())
        })
    })

    it('should not render badge if review count is zero', () => {
      notificationCount = TestData.notificationCount({ count: 0 })
      visitNotificationsService.getNotificationCount.mockResolvedValue(notificationCount)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="need-review-count"]').text()).toBe('')
        })
    })

    it('should render badge with value of "99+" if review count is greater than 99', () => {
      notificationCount = TestData.notificationCount({ count: 100 })
      visitNotificationsService.getNotificationCount.mockResolvedValue(notificationCount)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="need-review-count"]').text()).toBe('99+')
        })
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
