import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import {
  createMockBookerService,
  createMockVisitNotificationsService,
  createMockVisitRequestsService,
} from '../services/testutils/mocks'
import TestData from './testutils/testData'
import populateCurrentUser from '../middleware/populateCurrentUser'
import bapvUserRoles from '../constants/bapvUserRoles'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  let sessionData: SessionData
  let selectedEstablishment: SessionData['selectedEstablishment']

  const bookerService = createMockBookerService()
  const visitNotificationsService = createMockVisitNotificationsService()
  const visitRequestsService = createMockVisitRequestsService()

  const visitorRequestCount = 10
  const notificationCount = 5
  const visitRequestCount = 3

  beforeEach(() => {
    populateCurrentUser()
    selectedEstablishment = { ...TestData.prison(), isEnabledForPublic: false }
    sessionData = { selectedEstablishment } as SessionData

    app = appWithAllRoutes({
      services: { bookerService, visitNotificationsService, visitRequestsService },
      sessionData,
    })

    bookerService.getVisitorRequestCount.mockResolvedValue(visitorRequestCount)
    visitNotificationsService.getNotificationCount.mockResolvedValue(notificationCount)
    visitRequestsService.getVisitRequestCount.mockResolvedValue(visitRequestCount)
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

        expect(bookerService.getVisitorRequestCount).not.toHaveBeenCalled()
        expect(visitRequestsService.getVisitRequestCount).not.toHaveBeenCalled()
        expect(visitNotificationsService.getNotificationCount).toHaveBeenCalledWith(
          'user1',
          selectedEstablishment.prisonId,
        )
      })
  })

  describe('Requested visits tile', () => {
    beforeEach(() => {
      selectedEstablishment.isEnabledForPublic = true
    })

    it('should render badge with visit request count', () => {
      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-request-count"]').text()).toBe(visitRequestCount.toString())
          expect(visitRequestsService.getVisitRequestCount).toHaveBeenCalledWith(
            'user1',
            selectedEstablishment.prisonId,
          )
        })
    })

    it('should not render badge if visit request count is zero', () => {
      visitRequestsService.getVisitRequestCount.mockResolvedValue(0)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-request-count"]').text()).toBe('')
        })
    })

    it('should render badge with value of "99+" if review count is greater than 99', () => {
      visitRequestsService.getVisitRequestCount.mockResolvedValue(100)

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
          expect($('[data-test="need-review-count"]').text()).toBe(notificationCount.toString())
        })
    })

    it('should not render badge if review count is zero', () => {
      visitNotificationsService.getNotificationCount.mockResolvedValue(0)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="need-review-count"]').text()).toBe('')
        })
    })

    it('should render badge with value of "99+" if review count is greater than 99', () => {
      visitNotificationsService.getNotificationCount.mockResolvedValue(100)

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="need-review-count"]').text()).toBe('99+')
        })
    })
  })

  describe('Booker management tile', () => {
    it('should not render tile if role is missing from user', () => {
      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.card').length).toBe(5)

          expect($('[data-test="booker-management"] .card__link').text()).toBe('')
          expect($('[data-test="booker-management"] .card__link').attr('href')).toBe(undefined)
          expect($('[data-test="visitor-request-count"]').text()).toBe('')

          expect(bookerService.getVisitorRequestCount).not.toHaveBeenCalled()
        })
    })

    it('should render tile if role is present and with no count for a non-public-enabled prison', () => {
      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
        services: { bookerService, visitNotificationsService, visitRequestsService },
        sessionData,
      })

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.card').length).toBe(6)

          expect($('[data-test="booker-management"] .card__link').text()).toBe('Manage online bookers')
          expect($('[data-test="booker-management"] .card__link').attr('href')).toBe('/manage-bookers')
          expect($('[data-test="visitor-request-count"]').text()).toBe('')

          expect(bookerService.getVisitorRequestCount).not.toHaveBeenCalled()
        })
    })

    it('should render tile with visitor request count badge if feature enabled, prison is public-enabled and role is present', () => {
      selectedEstablishment.isEnabledForPublic = true

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
        services: { bookerService, visitNotificationsService, visitRequestsService },
        sessionData,
      })

      return request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.card').length).toBe(7)

          expect($('[data-test="visitor-request-count"]').text()).toBe('10')

          expect(bookerService.getVisitorRequestCount).toHaveBeenCalledWith({ username: 'user1', prisonId: 'HEI' })
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
