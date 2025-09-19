import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import config from '../config'

let app: Express

describe('Maintenance page', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('should render maintenance page when enabled (no end date set)', () => {
    jest.replaceProperty(config, 'maintenance', {
      enabled: true,
      endDateTime: '',
    })
    app = appWithAllRoutes({})

    return request(app)
      .get('/any-path')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Sorry, the service is unavailable')
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('[data-test="maintenance-message"]').text()).toBe('You will be able to use the service later.')
      })
  })

  it('should render maintenance page when enabled (end date set)', () => {
    jest.replaceProperty(config, 'maintenance', {
      enabled: true,
      endDateTime: '2025-10-01T13:30',
    })
    app = appWithAllRoutes({})

    return request(app)
      .get('/any-other-path')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Sorry, the service is unavailable')
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('[data-test="maintenance-message"]').text()).toBe(
          'You will be able to use the service from 1:30pm on Wednesday 1 October 2025.',
        )
      })
  })

  it('should redirect to / for POST routes', () => {
    jest.replaceProperty(config, 'maintenance', {
      enabled: true,
      endDateTime: '',
    })
    app = appWithAllRoutes({})

    return request(app).post('/form-submission-path').expect(302).expect('location', '/')
  })
})
