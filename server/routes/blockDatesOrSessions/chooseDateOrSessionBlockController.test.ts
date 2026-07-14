import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const url = '/block-visit-dates-or-sessions/block-date-or-session'
const date = '2024-09-06'

beforeEach(() => {
  sessionData = { blockDateOrSession: { date, backLinkHref: '#back-link-from-session' } } as SessionData

  app = appWithAllRoutes({ sessionData })

  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Choose date or session block', () => {
  describe(`GET ${url}`, () => {
    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.blockDateOrSession = undefined
      return request(app).get(url).expect(302).expect('location', '/block-visit-dates-or-sessions')
    })

    it('should display choose date or session block page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toBe('/block-visit-dates-or-sessions')
          expect($('h1').text()).toBe('What would you like to block on Friday 6 September 2024?')

          expect($('form[action="/block-visit-dates-or-sessions/block-date-or-session"][method=POST]').length).toBe(1)
          expect($('input[name=blockType]').length).toBe(2)
          expect($('input[name=blockType]').eq(0).val()).toBe('date')
          expect($('input[name=blockType]').eq(1).val()).toBe('session')
          expect($('input[name=blockType]:checked').length).toBe(0)

          expect($('[data-test=submit]').text().trim()).toBe('Continue')
        })
        .expect(() => {
          expect(sessionData.blockDateOrSession.backLinkHref).toBe('/block-visit-dates-or-sessions')
        })
    })

    it('should render validation errors', () => {
      const validationError = { path: 'blockType', msg: 'No answer selected' } as FieldValidationError

      flashData = { errors: [validationError] }

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#blockType-error"]').text()).toBe(validationError.msg)
          expect($('#blockType-error').text()).toContain(validationError.msg)
        })
    })
  })

  describe(`POST ${url}`, () => {
    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.blockDateOrSession = undefined
      return request(app).post(url).expect(302).expect('location', '/block-visit-dates-or-sessions')
    })

    it('should redirect to block new date page if this is selected', () => {
      return request(app)
        .post(url)
        .send({ blockType: 'date' })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-new-date')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledTimes(0)
          expect(sessionData.blockDateOrSession.backLinkHref).toBe(
            '/block-visit-dates-or-sessions/block-date-or-session',
          )
        })
    })

    it('should redirect to block new session choose page if this is selected', () => {
      return request(app)
        .post(url)
        .send({ blockType: 'session' })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-new-session/choose')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledTimes(0)
          expect(sessionData.blockDateOrSession.backLinkHref).toBe(
            '/block-visit-dates-or-sessions/block-date-or-session',
          )
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'blockType',
        type: 'field',
        value: 'invalid',
      }

      return request(app)
        .post(url)
        .send({ blockType: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-date-or-session')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })
  })
})
