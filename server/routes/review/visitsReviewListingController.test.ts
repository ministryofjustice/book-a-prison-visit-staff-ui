import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitNotificationsService } from '../../services/testutils/mocks'
import { notificationTypeReasons, notificationTypes } from '../../constants/notifications'
import { FilterField, VisitsReviewListItem } from '../../@types/bapv'

let app: Express

const visitNotificationsService = createMockVisitNotificationsService()

beforeEach(() => {
  app = appWithAllRoutes({ services: { visitNotificationsService } })

  visitNotificationsService.getVisitsReviewList.mockResolvedValue({ filters: [], visitsReviewList: [] })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Bookings needing review listing page', () => {
  const noAppliedFilters = {
    bookedBy: <string[]>[],
    type: <string[]>[],
  }

  describe('GET /review', () => {
    it('should display bookings review listing page', () => {
      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('h1').text()).toBe('Visit bookings that need review')

          const numNotificationTypes = Object.keys(notificationTypeReasons).length
          expect($('[data-test="review-reasons-list"] li').length).toBe(numNotificationTypes)

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI', noAppliedFilters)
        })
    })

    it('should display bookings review listing page with bookings that need review, with no filters applied', () => {
      const visitsReviewList: VisitsReviewListItem[] = [
        {
          actionUrl: '/visit/ab-cd-ef-gh?from=review',
          bookedByNames: ['User Three'],
          prisonerNumbers: ['B1234CD'],
          reference: 'bc*de*fg*gh',
          type: 'PRISONER_RELEASED_EVENT',
          visitDates: ['2 November 2023'],
        },
        {
          actionUrl: '/visit/ij-kl-mn-op?from=review',
          bookedByNames: ['User Four'],
          prisonerNumbers: ['C1234EF'],
          reference: 'ij*kl*mn*op',
          type: 'PRISONER_RECEIVED_EVENT',
          visitDates: ['3 November 2023'],
        },
      ]

      visitNotificationsService.getVisitsReviewList.mockResolvedValue({ filters: [], visitsReviewList })

      return request(app)
        .get('/review')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          expect($('[data-test="bookings-list"] tbody tr').length).toBe(2)

          expect($('[data-test="prisoner-number-1"]').text().trim()).toBe('B1234CD')
          expect($('[data-test="visit-date-1"]').text().trim()).toBe('2 November 2023')
          expect($('[data-test="booked-by-1"]').text().trim()).toBe('User Three')
          expect($('[data-test="type-1"]').text().trim()).toBe(notificationTypes[visitsReviewList[0].type])
          expect($('[data-test="action-1"] a').attr('href')).toBe(visitsReviewList[0].actionUrl)

          expect($('[data-test="prisoner-number-2"]').text().trim()).toBe('C1234EF')
          expect($('[data-test="visit-date-2"]').text().trim()).toBe('3 November 2023')
          expect($('[data-test="booked-by-2"]').text().trim()).toBe('User Four')
          expect($('[data-test="type-2"]').text().trim()).toBe(notificationTypes[visitsReviewList[1].type])
          expect($('[data-test="action-2"] a').attr('href')).toBe(visitsReviewList[1].actionUrl)

          expect($('[data-test="no-bookings"]').length).toBe(0)
          expect($('[data-test="no-bookings-for-filters"]').length).toBe(0)

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI', noAppliedFilters)
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
          expect($('[data-test="no-bookings-for-filters"]').length).toBe(0)

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI', noAppliedFilters)
        })
    })

    it('should display bookings review listing page with message when none to review because of selected filters', () => {
      const filters: FilterField[] = [
        {
          id: 'bookedBy',
          label: 'Booked by',
          items: [{ label: 'User One', value: 'user1', checked: true }],
        },
      ]
      visitNotificationsService.getVisitsReviewList.mockResolvedValue({ filters, visitsReviewList: [] })

      return request(app)
        .get('/review?bookedBy=user1&type=NON_ASSOCIATION')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="bookings-list"]').length).toBe(0)
          expect($('[data-test="no-bookings"]').length).toBe(0)
          expect($('[data-test="no-bookings-for-filters"]').text()).toBe(
            'There are no bookings to review for Hewell (HMP) that match the selected filters.',
          )

          expect(visitNotificationsService.getVisitsReviewList).toHaveBeenCalledWith('user1', 'HEI', {
            bookedBy: ['user1'],
            type: ['NON_ASSOCIATION'],
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
        .send('type=NON_ASSOCIATION')
        .send('invalid=xyz')
        .expect(302)
        .expect('Location', '/review?bookedBy=user1&bookedBy=user2&type=NON_ASSOCIATION')
    })
  })
})
