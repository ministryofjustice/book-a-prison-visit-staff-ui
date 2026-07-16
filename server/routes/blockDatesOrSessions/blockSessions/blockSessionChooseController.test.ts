import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider } from '../../testutils/appSetup'
import { createMockVisitSessionsService } from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const visitSessionsService = createMockVisitSessionsService()

const url = '/block-visit-dates-or-sessions/block-new-session/choose'
const date = '2024-09-06'

const session1 = TestData.sessionSchedule({
  sessionTemplateReference: 'session-1',
  sessionTimeSlot: { startTime: '10:00', endTime: '11:00' },
})

const session2Blocked = TestData.sessionSchedule({
  sessionTemplateReference: 'session-2',
  sessionTimeSlot: { startTime: '14:00', endTime: '15:00' },
  isSessionExcluded: true,
  prisonerIncentiveLevelGroupNames: ['Standard'],
})

beforeEach(() => {
  sessionData = { blockDateOrSession: { date, backLinkHref: '#back-link-from-session' } } as SessionData

  visitSessionsService.getSessionSchedule.mockResolvedValue([session1, session2Blocked])

  app = appWithAllRoutes({ services: { visitSessionsService }, sessionData })

  flashData = {}
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Choose which session to block', () => {
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
          expect($('.govuk-back-link').attr('href')).toBe('/block-visit-dates-or-sessions/block-date-or-session')
          expect($('h1').text()).toBe('Which session would you like to block on Friday 6 September 2024?')

          expect($('form[action="/block-visit-dates-or-sessions/block-new-session/choose"][method=POST]').length).toBe(
            1,
          )
          expect($('input[name=sessionTemplateReference]').length).toBe(2)
          expect($('input[name=sessionTemplateReference]:checked').length).toBe(0)
          // session 1
          expect($('input[name=sessionTemplateReference]').eq(0).val()).toBe('session-1')
          expect($('label[for=sessionTemplateReference]').text().trim()).toBe(
            '10am to 11am (Visits hall), All prisoners',
          )
          // session 2 (blocked)
          expect($('input[name=sessionTemplateReference]').eq(1).val()).toBe('session-2')
          expect($('label[for=sessionTemplateReference-2]').text().trim()).toBe(
            '2pm to 3pm (Visits hall), Prisoners on Standard',
          )
          expect($('input[name=sessionTemplateReference]').eq(1).prop('disabled')).toBe(true)

          expect($('[data-test=submit]').text().trim()).toBe('Continue')
        })
        .expect(() => {
          expect(sessionData.blockDateOrSession.backLinkHref).toBe(
            '/block-visit-dates-or-sessions/block-date-or-session',
          )

          expect(sessionData.blockDateOrSession.sessions).toEqual([session1, session2Blocked])

          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            date,
            includeExcludedSessions: true,
          })
        })
    })

    it('should return to the choose day or session page with an error if all sessions are blocked', () => {
      visitSessionsService.getSessionSchedule.mockResolvedValue([session2Blocked])

      return request(app)
        .get(url)
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-date-or-session')

        .expect(() => {
          expect(sessionData.blockDateOrSession.sessions).toBeUndefined()
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'All sessions for that date are already blocked',
              path: 'blockType',
              type: 'field',
              value: 'session',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { blockType: 'session' })
        })
    })

    it('should render validation errors', () => {
      const validationError = { path: 'sessionTemplateReference', msg: 'No session selected' } as FieldValidationError

      flashData = { errors: [validationError] }

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#sessionTemplateReference-error"]').text()).toBe(validationError.msg)
          expect($('#sessionTemplateReference-error').text()).toContain(validationError.msg)
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      sessionData.blockDateOrSession.sessions = [session1, session2Blocked]
    })

    it('should redirect to blocked dates listing page if no new block date in session', () => {
      sessionData.blockDateOrSession = undefined
      return request(app).post(url).expect(302).expect('location', '/block-visit-dates-or-sessions')
    })

    it('should store selected session and redirect to confirmation page', () => {
      return request(app)
        .post(url)
        .send({ sessionTemplateReference: session1.sessionTemplateReference })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-new-session/confirm')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledTimes(0)
          expect(sessionData.blockDateOrSession.backLinkHref).toBe(
            '/block-visit-dates-or-sessions/block-new-session/choose',
          )
          expect(sessionData.blockDateOrSession.selectedSession).toEqual(session1)
        })
    })

    it('should set form validation errors and redirect to same page', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No session selected',
        path: 'sessionTemplateReference',
        type: 'field',
        value: 'invalid',
      }

      return request(app)
        .post(url)
        .send({ sessionTemplateReference: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-new-session/choose')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledTimes(1)
          expect(sessionData.blockDateOrSession.selectedSession).toBeUndefined()
        })
    })

    it('should not allow an already-blocked session to be selected', () => {
      return request(app)
        .post(url)
        .send({ sessionTemplateReference: session2Blocked.sessionTemplateReference })
        .expect(302)
        .expect('location', '/block-visit-dates-or-sessions/block-new-session/choose')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expect.anything())
          expect(flashProvider).toHaveBeenCalledTimes(1)
          expect(sessionData.blockDateOrSession.selectedSession).toBeUndefined()
        })
    })
  })
})
