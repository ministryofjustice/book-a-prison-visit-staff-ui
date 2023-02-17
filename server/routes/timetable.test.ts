import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import config from '../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})

  config.features.viewTimetableEnabled = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View visits timetable', () => {
  it('should return a 404 if the feature is disabled', () => {
    config.features.viewTimetableEnabled = false
    app = appWithAllRoutes({})

    return request(app).get('/timetable').expect(404)
  })

  it('should render the visits timetable page', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('h2:nth-of-type(2)').text()).toBe('Request changes to the timetable')
        expect($('[data-test="change-request"]').attr('href')).toBe('LINK_TBC')
      })
  })
})
