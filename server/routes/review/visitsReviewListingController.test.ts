import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitNotificationsService } from '../../services/testutils/mocks'
import { notificationTypeReasons, notificationTypes } from '../../constants/notifications'
import TestData from '../testutils/testData'

let app: Express

const visitNotificationsService = createMockVisitNotificationsService()

beforeEach(() => {
  app = appWithAllRoutes({ services: { visitNotificationsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Bookings needing review listing page', () => {
  describe('GET /review', () => {
    it('should display bookings review listing page with review reasons list', () => {
      visitNotificationsService.getVisitNotifications.mockResolvedValue([])

      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('h1').text()).toBe('Visits that need review')

          const numNotificationTypes = Object.keys(notificationTypeReasons).length
          expect($('[data-test="review-reasons-list"] li').length).toBe(numNotificationTypes)

          expect(visitNotificationsService.getVisitNotifications).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
          })
        })
    })

    it('should display bookings review listing page with bookings that need review, with no filters applied', () => {
      const visitNotifications = [
        TestData.visitNotifications({
          visitReference: 'ab-cd-ef-gh',
          prisonerNumber: 'A1234BC',
          bookedByUserName: 'user1',
          bookedByName: 'User One',
          visitDate: '2023-11-02',
          notifications: [
            TestData.visitNotificationEvent({ type: 'PRISONER_RELEASED_EVENT' }),
            TestData.visitNotificationEvent({ type: 'PRISON_VISITS_BLOCKED_FOR_DATE' }),
          ],
        }),

        TestData.visitNotifications({
          visitReference: 'bc-de-fg-hi',
          prisonerNumber: 'B1234CD',
          bookedByUserName: 'user2',
          bookedByName: 'User Two',
          visitDate: '2023-11-03',
          notifications: [TestData.visitNotificationEvent({ type: 'VISITOR_RESTRICTION' })],
        }),
      ]

      visitNotificationsService.getVisitNotifications.mockResolvedValue(visitNotifications)

      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          expect($('[data-test="bookings-list"] tbody tr').length).toBe(2)

          expect($('[data-test="prisoner-number-1"]').text()).toBe('A1234BC')
          expect($('[data-test="visit-date-1"]').text()).toBe('2 November 2023')
          expect($('[data-test="booked-by-1"]').text()).toBe('User One')
          expect($('[data-test="type-1"]').text()).toContain(notificationTypes.PRISONER_RELEASED_EVENT)
          expect($('[data-test="type-1"]').text()).toContain(notificationTypes.PRISON_VISITS_BLOCKED_FOR_DATE)
          expect($('[data-test="action-1"] a').attr('href')).toBe('/visit/ab-cd-ef-gh?from=review')

          expect($('[data-test="prisoner-number-2"]').text()).toBe('B1234CD')
          expect($('[data-test="visit-date-2"]').text()).toBe('3 November 2023')
          expect($('[data-test="booked-by-2"]').text()).toBe('User Two')
          expect($('[data-test="type-2"]').text()).toContain(notificationTypes.VISITOR_RESTRICTION)
          expect($('[data-test="action-2"] a').attr('href')).toBe('/visit/bc-de-fg-hi?from=review')

          expect($('[data-test="no-bookings"]').length).toBe(0)
          expect($('[data-test="no-bookings-for-filters"]').length).toBe(0)

          expect(visitNotificationsService.getVisitNotifications).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
          })
        })
    })

    it('should display bookings review listing page with message when none to review', () => {
      visitNotificationsService.getVisitNotifications.mockResolvedValue([])

      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="bookings-list"]').length).toBe(0)
          expect($('[data-test="no-bookings"]').text()).toBe('There are no bookings for Hewell (HMP) that need review.')
          expect($('[data-test="no-bookings-for-filters"]').length).toBe(0)

          expect(visitNotificationsService.getVisitNotifications).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
          })
        })
    })

    it('should display bookings review listing page with message when none to review because of selected filters', () => {
      const visitNotifications = [
        TestData.visitNotifications({
          bookedByUserName: 'user1',
          notifications: [TestData.visitNotificationEvent({ type: 'PRISONER_RECEIVED_EVENT' })],
        }),

        TestData.visitNotifications({
          bookedByUserName: 'user2',
          notifications: [TestData.visitNotificationEvent({ type: 'VISITOR_RESTRICTION' })],
        }),
      ]

      visitNotificationsService.getVisitNotifications.mockResolvedValue(visitNotifications)

      return request(app)
        .get('/review?bookedBy=use12&type=VISITOR_RESTRICTION')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="bookings-list"]').length).toBe(0)
          expect($('[data-test="no-bookings"]').length).toBe(0)
          expect($('[data-test="no-bookings-for-filters"]').text()).toBe(
            'There are no bookings to review for Hewell (HMP) that match the selected filters.',
          )

          expect(visitNotificationsService.getVisitNotifications).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
          })
        })
    })
  })

  describe('POST /review', () => {
    it('should redirect to GET /review when no request body parameters set', () => {
      return request(app).post('/review').expect(302).expect('Location', '/review')
    })

    it('should redirect to GET /review with query parameters based on request body and ignoring invalid parameters', () => {
      return request(app)
        .post('/review')
        .send('bookedBy=user1')
        .send('bookedBy=user2')
        .send('type=VISITOR_RESTRICTION')
        .send('invalid=xyz')
        .expect(302)
        .expect('Location', '/review?bookedBy=user1&bookedBy=user2&type=VISITOR_RESTRICTION')
    })
  })
})
