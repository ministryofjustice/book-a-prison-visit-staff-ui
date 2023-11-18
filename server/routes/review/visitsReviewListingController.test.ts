import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import config from '../../config'
import { createMockVisitNotificationsService } from '../../services/testutils/mocks'
import {
  notificationTypeDescriptions,
  notificationTypePathSegments,
  notificationTypes,
} from '../../constants/notificationEventTypes'
import { VisitsReviewListItem } from '../../@types/bapv'

let app: Express

const visitNotificationsService = createMockVisitNotificationsService()

beforeEach(() => {
  config.features.showReviewBookingsTile = true
  app = appWithAllRoutes({ services: { visitNotificationsService } })

  visitNotificationsService.getVisitsReviewList.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Bookings needing review listing page', () => {
  describe('GET /review', () => {
    it('should return a 404 if the feature is not enabled', () => {
      config.features.showReviewBookingsTile = false
      app = appWithAllRoutes({})
      return request(app).get('/review').expect('Content-Type', /html/).expect(404)
    })

    it('should display bookings review listing page', () => {
      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toBe('/')
          expect($('h1').text()).toBe('Visit bookings that need review')

          const numNotificationTypes = Object.keys(notificationTypeDescriptions).length
          expect($('[data-test="review-reasons-list"] li').length).toBe(numNotificationTypes)

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI')
        })
    })

    it('should display bookings review listing page with message when none to review', () => {
      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="bookings-list"]').length).toBe(0)
          expect($('[data-test="no-bookings"]').text()).toBe('There are no bookings for Hewell (HMP) that need review.')

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI')
        })
    })

    it('should display bookings review listing page with bookings that need review', () => {
      const listItems: VisitsReviewListItem[] = [
        {
          bookedByNames: ['User One', 'User Two'],
          prisonerNumbers: ['A1234BC', 'A5678CD'],
          reference: 'ab*cd*ef*gh',
          type: 'NON_ASSOCIATION_EVENT',
          visitDates: ['1 November 2023'],
        },
        {
          bookedByNames: ['User Three', 'User Four'],
          prisonerNumbers: ['B1234CD'],
          reference: 'bc*de*fg*gh',
          type: 'PRISONER_RELEASED_EVENT',
          visitDates: ['2 November 2023', '11 November 2023'],
        },
      ]
      visitNotificationsService.getVisitsReviewList.mockResolvedValue(listItems)

      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="bookings-list"]').length).toBe(1)
          expect($('[data-test="no-bookings"]').length).toBe(0)

          expect($('[data-test="prisoner-number-1"]').text().trim()).toMatch(/^A1234BC\s+A5678CD$/)
          expect($('[data-test="visit-date-1"]').text().trim()).toBe('1 November 2023')
          expect($('[data-test="booked-by-1"]').text().trim()).toMatch(/^User One\s+User Two$/)
          expect($('[data-test="type-1"]').text().trim()).toBe(notificationTypes[listItems[0].type])
          expect($('[data-test="action-1"] a').attr('href')).toBe(
            `/review/${notificationTypePathSegments[listItems[0].type]}/${listItems[0].reference}`,
          )

          expect($('[data-test="prisoner-number-2"]').text().trim()).toBe('B1234CD')
          expect($('[data-test="visit-date-2"]').text().trim()).toMatch(/^2 November 2023\s+11 November 2023$/)
          expect($('[data-test="booked-by-2"]').text().trim()).toMatch(/^User Three\s+User Four$/)
          expect($('[data-test="type-2"]').text().trim()).toBe(notificationTypes[listItems[1].type])
          expect($('[data-test="action-2"] a').attr('href')).toBe(
            `/review/${notificationTypePathSegments[listItems[1].type]}/${listItems[1].reference}`,
          )

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI')
        })
    })
  })
})
