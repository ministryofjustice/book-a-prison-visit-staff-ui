import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import { createMockVisitNotificationsService } from '../services/testutils/mocks'
import TestData from './testutils/testData'
import { Prison } from '../@types/bapv'
import { setFeature } from '../data/testutils/mockFeature'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  let sessionData: SessionData
  let selectedEstablishment: Prison

  const visitNotificationsService = createMockVisitNotificationsService()
  let visitRequestCount = TestData.visitRequestCount()
  let notificationCount = TestData.notificationCount()

  beforeEach(() => {
    setFeature('visitRequest', false)

    selectedEstablishment = TestData.prison()
    sessionData = { selectedEstablishment } as SessionData

    app = appWithAllRoutes({ services: { visitNotificationsService }, sessionData })

    visitNotificationsService.getVisitRequestCount.mockResolvedValue(visitRequestCount)
    visitNotificationsService.getNotificationCount.mockResolvedValue(notificationCount)
  })

  it('should render the home page cards', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.govuk-breadcrumbs li').length).toBe(1)

        expect($('.card').length).toBe(5)

        expect($('[data-test="book-or-change-visit"] .card__link').text()).toBe('Book or change a visit')
        expect($('[data-test="book-or-change-visit"] .card__link').attr('href')).toBe('/search/prisoner')

        expect($('[data-test="need-review"] .card__link').text()).toContain('Visits that need review')
        expect($('[data-test="need-review"] .card__link').attr('href')).toBe('/review')

        expect($('[data-test="view-visits-by-date"] .card__link').text()).toBe('View visits by date')
        expect($('[data-test="view-visits-by-date"] .card__link').attr('href')).toBe('/visits')

        expect($('[data-test="view-timetable"] .card__link').text()).toBe('Visits timetable')
        expect($('[data-test="view-timetable"] .card__link').attr('href')).toBe('/timetable')

        expect($('[data-test="block-dates"] .card__link').text()).toBe('Block visit dates')
        expect($('[data-test="block-dates"] .card__link').attr('href')).toBe('/block-visit-dates')

        expect(visitNotificationsService.getVisitRequestCount).not.toHaveBeenCalled()
        expect(visitNotificationsService.getNotificationCount).toHaveBeenCalledWith(
          'user1',
          selectedEstablishment.prisonId,
        )
      })
  })

  describe('Requested visits tile', () => {
    // requires feature to be enabled and PUBLIC prison
    beforeEach(() => {
      setFeature('visitRequest', true)
      selectedEstablishment.clients.push({ userType: 'PUBLIC', active: true })
    })

    it('should render badge with visit request count', () => {
      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-request-count"]').text()).toBe(visitRequestCount.count.toString())
          expect(visitNotificationsService.getVisitRequestCount).toHaveBeenCalledWith(
            'user1',
            selectedEstablishment.prisonId,
          )
        })
    })

    it('should not render badge if visit request count is zero', () => {
      visitRequestCount = TestData.visitRequestCount({ count: 0 })
      visitNotificationsService.getVisitRequestCount.mockResolvedValue(visitRequestCount)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-request-count"]').text()).toBe('')
        })
    })

    it('should render badge with value of "99+" if review count is greater than 99', () => {
      visitRequestCount = TestData.visitRequestCount({ count: 100 })
      visitNotificationsService.getVisitRequestCount.mockResolvedValue(visitRequestCount)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-request-count"]').text()).toBe('99+')
        })
    })
  })

  describe('Visits that need review tile', () => {
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

    app = appWithAllRoutes({})

    return request(app)
      .get('/back-to-start')
      .expect(302)
      .expect('location', '/')
      .expect(res => {
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
