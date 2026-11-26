import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { setFeature } from '../../data/testutils/mockFeature'

let app: Express
let flashData: FlashData

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /record-attendance - Record visit attendance', () => {
  beforeEach(() => {
    setFeature('recordAttendance', true)

    flashData = {}
    flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

    app = appWithAllRoutes({})
  })

  it('should return a 404 if the feature is not enabled', () => {
    setFeature('recordAttendance', false)
    app = appWithAllRoutes({})

    return request(app).get('/record-attendance').expect(404)
  })

  it('should render the record attendance listing page', () => {
    return request(app)
      .get('/record-attendance')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-breadcrumbs li').length).toBe(2)
        expect($('.moj-alert').length).toBe(0)
        expect($('h1').text()).toBe('Record attendance')

        // TODO flesh out test
      })
  })

  it('should show messages set in flash', () => {
    const message = TestData.mojAlert()
    flashData.messages = [message]

    return request(app)
      .get('/record-attendance')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').text()).toContain(message.title)
        expect($('.moj-alert').text()).toContain(message.text)
        expect($('h1').text()).toBe('Record attendance')
      })
  })
})
