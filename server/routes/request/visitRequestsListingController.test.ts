import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitRequestsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { setFeature } from '../../data/testutils/mockFeature'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /requested-visits - Requested visits listing', () => {
  const visitRequestsService = createMockVisitRequestsService()

  beforeEach(() => {
    setFeature('visitRequest', true)
    app = appWithAllRoutes({ services: { visitRequestsService } })
  })

  it('should return a 404 if FEATURE_VISIT_REQUEST is disabled', () => {
    setFeature('visitRequest', false)
    app = appWithAllRoutes({ services: { visitRequestsService } })
    return request(app).get('/requested-visits').expect(404)
  })

  it('should render the requested visits listing page - with requests to review', () => {
    const visitRequest = TestData.visitRequestSummary()
    visitRequestsService.getVisitRequests.mockResolvedValue([visitRequest])

    return request(app)
      .get('/requested-visits')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-breadcrumbs li').length).toBe(2)
        expect($('h1').text()).toBe('Requested visits')
        expect($('[data-test=check-before-days]').text()).toBe('2 days')

        expect($('[data-test=visit-requests] tbody tr').length).toBe(1)

        expect($('[data-test=visit-date-1]').text()).toBe('10/7/2025')
        expect($('[data-test=visit-requested-date-1]').text()).toBe('1/7/2025')
        expect($('[data-test=prisoner-name-1]').text()).toBe('John Smith')
        expect($('[data-test=prison-number-1]').text()).toBe('A1234BC')
        expect($('[data-test=main-contact-1]').text()).toBe('Jeanette Smith')
        expect($('[data-test=action-1]').text()).toBe('View request to visit John Smith')
        expect($('[data-test=action-1] a').attr('href')).toBe('/visit/ab-cd-ef-gh?from=request')

        expect($('[data-test=no-visit-requests]').length).toBe(0)

        expect(visitRequestsService.getVisitRequests).toHaveBeenCalledWith('user1', 'HEI')
      })
  })

  it('should render the requested visits listing page - with no requests to review', () => {
    visitRequestsService.getVisitRequests.mockResolvedValue([])

    return request(app)
      .get('/requested-visits')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-breadcrumbs li').length).toBe(2)
        expect($('h1').text()).toBe('Requested visits')

        expect($('[data-test=visit-requests] tbody tr').length).toBe(0)
        expect($('[data-test=no-visit-requests]').length).toBe(1)

        expect(visitRequestsService.getVisitRequests).toHaveBeenCalledWith('user1', 'HEI')
      })
  })
})
