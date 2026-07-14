import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { addDays, addWeeks, format, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { createMockBlockDatesOrSessionsService, createMockVisitSessionsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { setFeature } from '../../data/testutils/mockFeature'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const blockDatesOrSessionsService = createMockBlockDatesOrSessionsService()
const visitSessionsService = createMockVisitSessionsService()
const url = '/block-visit-dates'

afterEach(() => {
  jest.resetAllMocks()
})

describe('Block visit dates and sessions listing page', () => {
  describe(`GET ${url}`, () => {
    beforeEach(() => {
      setFeature('sessionDateBlocks', true)

      app = appWithAllRoutes({ services: { blockDatesOrSessionsService, visitSessionsService } })

      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    // TODO remove this test block once session blocks are fully implemented
    describe(`GET ${url} (date blocks ONLY - sessionDateBlocks feature disabled)`, () => {
      beforeEach(() => {
        setFeature('sessionDateBlocks', false)
        app = appWithAllRoutes({ services: { blockDatesOrSessionsService, visitSessionsService } })
      })

      it('should display block visit dates page with a blocked dates listed', () => {
        const today = new Date()
        const tomorrow = addDays(today, 1)
        const nextWeek = addWeeks(today, 1)
        const blockedDate1 = TestData.excludeDateDto({ excludeDate: format(tomorrow, 'yyyy-MM-dd') })
        const blockedDate2 = TestData.excludeDateDto({ excludeDate: format(nextWeek, 'yyyy-MM-dd') })

        blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([blockedDate1, blockedDate2])

        return request(app)
          .get(url)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.govuk-breadcrumbs li').length).toBe(2)
            expect($('h1').text()).toBe('Block visit dates')

            expect($('.moj-alert').length).toBe(0)

            expect($('form[action="/block-visit-dates"][method=POST]').length).toBe(1)
            expect($('.moj-datepicker').attr('data-min-date')).toBe(format(today, 'dd/MM/yyyy'))
            expect($('input[name=date]').val()).toBeFalsy()

            expect($('[data-test="blocked-date-1"]').text()).toBe(format(blockedDate1.excludeDate, 'EEEE d MMMM yyyy'))
            expect($('[data-test="blocked-by-1"]').text()).toBe('User one')
            expect($('[data-test="unblock-date-1"]').text().trim()).toBe('Unblock')
            expect($('[data-test="blocked-date-2"]').text()).toBe(format(blockedDate2.excludeDate, 'EEEE d MMMM yyyy'))
            expect($('[data-test="blocked-by-2"]').text()).toBe('User one')
            expect($('[data-test="unblock-date-2"]').text().trim()).toBe('Unblock')

            expect($('[data-test=no-blocked-dates]').length).toBe(0)
          })
      })

      it('should display block visit dates page with no blocked dates listed', () => {
        blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([])

        return request(app)
          .get(url)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Block visit dates')

            expect($('[data-test=blocked-dates-table]').length).toBe(0)
            expect($('[data-test=no-blocked-dates]').length).toBe(1)
          })
      })

      it('should render success message', () => {
        const alert = TestData.mojAlert({ showTitleAsHeading: false })
        flashData = { messages: [alert] }

        blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([])

        return request(app)
          .get(url)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Block visit dates')

            expect($('.moj-alert__content').text()).toBe(alert.text)
          })
      })

      it('should render validation errors and pre-populate with formValues', () => {
        const validationError: FieldValidationError = {
          type: 'field',
          location: 'body',
          path: 'date',
          value: '1/2/2000',
          msg: 'The date must be in the future',
        }
        const formValues = { date: '1/2/2000' }
        flashData = { errors: [validationError], formValues: [formValues] }

        blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([])

        return request(app)
          .get(url)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Block visit dates')

            expect($('.govuk-error-summary a[href="#date-error"]').text()).toBe(validationError.msg)
            expect($('#date-error').text()).toContain(validationError.msg)
            expect($('input[name=date]').val()).toBe('1/2/2000')
          })
      })
    })

    it('should display block visit dates or sessions page with a blocked dates listed', () => {
      const today = new Date()

      const blockedDatesAndSessions = TestData.prisonAndSessionsExcludeDatesDto({
        fullDateExclusions: [
          // Row 1
          { excludeDate: '2026-07-01', actionedBy: 'User One' },
        ],
        sessionExclusions: [
          // Row 2
          TestData.sessionExcludeDateDto({
            excludeDate: { excludeDate: '2026-07-02', actionedBy: 'User Two' },
            sessionTemplateReference: 'session-1',
          }),
        ],
      })

      blockDatesOrSessionsService.getFutureBlockedDatesAndSessions.mockResolvedValue(blockedDatesAndSessions)

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('h1').text()).toBe('Block visit dates or sessions')

          expect($('.moj-alert').length).toBe(0)

          expect($('.moj-datepicker').attr('data-min-date')).toBe(format(today, 'dd/MM/yyyy'))
          expect($('input[name=date]').val()).toBeFalsy()

          // Row 1
          expect($('[data-test="blocked-date-1"]').text()).toBe('Wednesday 1 July 2026')
          expect($('[data-test="blocked-when-1"]').text()).toBe('All day')
          expect($('[data-test="blocked-attendees-1"]').text()).toBe('All prisoners')
          expect($('[data-test="unblock-1"]').text().trim()).toBe('Unblock')
          expect($('[data-test="unblock-1"]').parent().attr('action')).toBe('/block-visit-dates/unblock-date')
          expect($('[data-test="unblock-1"]').siblings('input[type=hidden][name=date]').val()).toBe('2026-07-01')
          expect(
            $('[data-test="unblock-1"]').siblings('input[type=hidden][name=sessionTemplateReference]').length,
          ).toBe(0)

          // Row 2
          expect($('[data-test="blocked-date-2"]').text()).toBe('Thursday 2 July 2026')
          expect($('[data-test="blocked-when-2"]').text()).toBe('10am to 11:30am')
          expect($('[data-test="blocked-attendees-2"]').text()).toBe('All prisoners')
          expect($('[data-test="unblock-2"]').text().trim()).toBe('Unblock')
          expect($('[data-test="unblock-2"]').parent().attr('action')).toBe('/block-visit-dates/unblock-session')
          expect($('[data-test="unblock-2"]').siblings('input[type=hidden][name=date]').val()).toBe('2026-07-02')
          expect($('[data-test="unblock-2"]').siblings('input[type=hidden][name=sessionTemplateReference]').val()).toBe(
            'session-1',
          )

          expect($('[data-test=no-blocked-dates-or-sessions]').length).toBe(0)
        })
    })

    it('should display block visit dates or sessions page with no blocked dates or sessions listed', () => {
      blockDatesOrSessionsService.getFutureBlockedDatesAndSessions.mockResolvedValue({
        fullDateExclusions: [],
        sessionExclusions: [],
      })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Block visit dates or sessions')

          expect($('[data-test=blocked-dates-and-sessions-table]').length).toBe(0)
          expect($('[data-test=no-blocked-dates-or-sessions]').length).toBe(1)
        })
    })

    it('should render success message', () => {
      const alert = TestData.mojAlert({ showTitleAsHeading: false })
      flashData = { messages: [alert] }

      blockDatesOrSessionsService.getFutureBlockedDatesAndSessions.mockResolvedValue({
        fullDateExclusions: [],
        sessionExclusions: [],
      })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Block visit dates or sessions')

          expect($('.moj-alert__content').text()).toBe(alert.text)
        })
    })

    it('should render validation errors and pre-populate with formValues', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'date',
        value: '1/2/2000',
        msg: 'The date must be in the future',
      }
      const formValues = { date: '1/2/2000' }
      flashData = { errors: [validationError], formValues: [formValues] }

      blockDatesOrSessionsService.getFutureBlockedDatesAndSessions.mockResolvedValue({
        fullDateExclusions: [],
        sessionExclusions: [],
      })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Block visit dates or sessions')

          expect($('.govuk-error-summary a[href="#date-error"]').text()).toBe(validationError.msg)
          expect($('#date-error').text()).toContain(validationError.msg)
          expect($('input[name=date]').val()).toBe('1/2/2000')
        })
    })
  })

  describe(`POST ${url}`, () => {
    const datePickerDateFormat = 'd/M/yyyy'
    const expectedDateFormat = 'yyyy-MM-dd'
    const today = new Date()

    beforeEach(() => {
      setFeature('sessionDateBlocks', true)

      flashData = { errors: [], formValues: [] }

      sessionData = {} as SessionData
      blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([])
      visitSessionsService.getSessionSchedule.mockResolvedValue([])

      app = appWithAllRoutes({ services: { blockDatesOrSessionsService, visitSessionsService }, sessionData })
    })

    it('should set date to block in session and redirect to block new date confirmation page for a valid date (date with no sessions)', () => {
      const inputDate = format(today, datePickerDateFormat)
      const expectedOutputDate = format(today, expectedDateFormat)

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates/block-new-date')
        .expect(() => {
          expect(blockDatesOrSessionsService.getFutureBlockedDates).toHaveBeenCalledWith('HEI', 'user1')
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            date: expectedOutputDate,
            includeExcludedSessions: true,
          })
          expect(sessionData.blockDateOrSession).toStrictEqual({
            backLinkHref: '/block-visit-dates',
            date: expectedOutputDate,
          })
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    it('should set date to block in session and redirect to date or session choice page for a valid date (date with sessions)', () => {
      const inputDate = format(today, datePickerDateFormat)
      const expectedOutputDate = format(today, expectedDateFormat)

      visitSessionsService.getSessionSchedule.mockResolvedValue([TestData.sessionSchedule()])

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates/block-date-or-session')
        .expect(() => {
          expect(blockDatesOrSessionsService.getFutureBlockedDates).toHaveBeenCalledWith('HEI', 'user1')
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            date: expectedOutputDate,
            includeExcludedSessions: true,
          })
          expect(sessionData.blockDateOrSession).toStrictEqual({
            backLinkHref: '/block-visit-dates',
            date: expectedOutputDate,
          })
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    it('should NOT redirect to date or session choice page if feature not enabled', () => {
      setFeature('sessionDateBlocks', false)
      app = appWithAllRoutes({ services: { blockDatesOrSessionsService, visitSessionsService }, sessionData })

      const inputDate = format(today, datePickerDateFormat)
      visitSessionsService.getSessionSchedule.mockResolvedValue([TestData.sessionSchedule()])

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates/block-new-date')
    })

    describe('should set error and redirect back to listing page for an invalid date', () => {
      it.each([
        ['undefined', undefined, ''],
        ['empty string', ' ', ' '],
        ['text', 'NOT A DATE', 'NOT A DATE'],
        ['partial date', '1/2', '1/2'],
        ['wrong format y/m/d', '2000/2/1', '2000/2/1'],
        ['wrong format m/d/y', '1/13/2000', '1/13/2000'],
        ['non-existent date', '31/2/2000', '31/2/2000'],
      ])('%s', (_: string, input: string, expected: string) => {
        const expectedValidationError: FieldValidationError = {
          location: 'body',
          msg: 'Enter a valid date',
          path: 'date',
          type: 'field',
          value: '',
        }

        return request(app)
          .post(url)
          .send({ date: input })
          .expect(302)
          .expect('location', '/block-visit-dates')
          .expect(() => {
            expect(blockDatesOrSessionsService.getFutureBlockedDates).not.toHaveBeenCalled()
            expect(sessionData.blockDateOrSession).toBe(undefined)
            expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { date: expected })
          })
      })
    })

    it('should set error and redirect back to listing page for a date in the past', () => {
      const yesterday = startOfYesterday()
      const inputDate = format(yesterday, datePickerDateFormat)
      const expectedOutputDate = format(yesterday, expectedDateFormat)

      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'The date must be in the future',
        path: 'date',
        type: 'field',
        value: expectedOutputDate,
      }

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.getFutureBlockedDates).not.toHaveBeenCalled()
          expect(sessionData.blockDateOrSession).toBe(undefined)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { date: inputDate })
        })
    })

    it('should set error and redirect back to listing page when an already-blocked date is entered', () => {
      const inputDate = format(today, datePickerDateFormat)
      const expectedOutputDate = format(today, expectedDateFormat)

      blockDatesOrSessionsService.getFutureBlockedDates.mockResolvedValue([
        TestData.excludeDateDto({ excludeDate: expectedOutputDate }),
      ])

      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'The full day is already blocked for the date entered',
        path: 'date',
        type: 'field',
        value: expectedOutputDate,
      }

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.getFutureBlockedDates).toHaveBeenCalledWith('HEI', 'user1')
          expect(sessionData.blockDateOrSession).toBe(undefined)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { date: inputDate })
        })
    })
  })
})
