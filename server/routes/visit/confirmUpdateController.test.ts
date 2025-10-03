import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { VisitSessionData } from '../../@types/bapv'
import TestData from '../testutils/testData'

let app: Express
let flashData: FlashData

const prison = TestData.prison()
let visitSessionData: VisitSessionData

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
  app = appWithAllRoutes({
    services: {},

    sessionData: {
      selectedEstablishment: { ...prison, policyNoticeDaysMin: 4 },
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/:reference/confirm-update', () => {
  it('should render the confirm update page', () => {
    return request(app)
      .get(`/visit/ab-cd-ef-gh/confirm-update`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-back-link').attr('href')).toBe(`/visit/ab-cd-ef-gh`)
        expect($('h1').text().trim()).toContain('This visit is in less than 4 days.')
        expect($('h1').text().trim()).toContain('Do you want to update the booking?')
        expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh/confirm-update')
      })
  })
})

describe('POST /visit/:reference/confirm-update', () => {
  beforeEach(() => {
    visitSessionData = { allowOverBooking: false, prisoner: undefined, prisonId: '' }

    app = appWithAllRoutes({
      services: {},

      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })

  it('should redirect back to the visit summary if choosing not to proceed with update', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/confirm-update')
      .send('confirmUpdate=no')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh')
      .expect(res => {
        expect(visitSessionData).not.toHaveProperty('overrideBookingWindow')
      })
  })

  it('should redirect to select visitors page if choosing to proceed with update', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/confirm-update')
      .send('confirmUpdate=yes')
      .expect(302)
      .expect('location', '/update-a-visit/select-visitors')
      .expect(res => {
        expect(visitSessionData.overrideBookingWindow).toBe(true)
      })
  })

  it('should redirect to self with errors set if no option selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/confirm-update')
      .send('confirmUpdate=')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/confirm-update')
      .expect(() => {
        expect(visitSessionData).not.toHaveProperty('overrideBookingWindow')
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No option selected', path: 'confirmUpdate', type: 'field' },
        ])
      })
  })
})
