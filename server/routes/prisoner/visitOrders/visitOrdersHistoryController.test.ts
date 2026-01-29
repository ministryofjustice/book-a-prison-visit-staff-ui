import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'
import { createMockVisitOrdersService } from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'
import { setFeature } from '../../../data/testutils/mockFeature'

let app: Express

const visitOrdersService = createMockVisitOrdersService()

const visitOrderHistoryPage = TestData.visitOrderHistoryPage()
const { prisonerId } = visitOrderHistoryPage

const url = `/prisoner/${prisonerId}/visiting-orders-history`

beforeEach(() => {
  setFeature('voHistory', { enabled: true })

  visitOrdersService.getVoHistory.mockResolvedValue(visitOrderHistoryPage)

  app = appWithAllRoutes({ services: { visitOrdersService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit orders history', () => {
  describe(`GET ${url}`, () => {
    it('should return a 404 if FEATURE_VO_HISTORY not enabled', () => {
      setFeature('voHistory', { enabled: false })

      app = appWithAllRoutes({ services: { visitOrdersService } })

      return request(app).get(url).expect(404)
    })

    it('should render visiting orders history page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Visiting orders history -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(`/prisoner/${prisonerId}#visiting-orders`)
          expect($('h1').text().trim()).toBe('Visiting orders history')

          // Prisoner details
          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
          expect($('[data-test=prisoner-category]').text()).toBe('Cat C')
          expect($('[data-test=prisoner-convicted-status]').text()).toBe('Convicted')
          expect($('[data-test=prisoner-incentive-level]').text()).toBe('Standard')

          // Visiting orders history table
          expect($('[data-test=date-0]').text()).toBe('1/12/2025')
          expect($('[data-test=reason-0]').text()).toBe('VO expired')
          expect($('[data-test=vo-change-0]').text()).toBe('1')
          expect($('[data-test=vo-balance-0]').text()).toBe('5')
          expect($('[data-test=pvo-change-0]').text()).toBe('0')
          expect($('[data-test=pvo-balance-0]').text()).toBe('2')

          expect(visitOrdersService.getVoHistory).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            prisonerId,
          })
        })
    })

    it('should render 400 Bad Request error for invalid prisoner number', () => {
      return request(app).get('/prisoner/A12--34BC/visiting-orders-history').expect(400)
    })
  })
})
