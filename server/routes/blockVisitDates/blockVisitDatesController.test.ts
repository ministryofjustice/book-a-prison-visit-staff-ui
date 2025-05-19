import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { addDays, addWeeks, format, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { createMockBlockedDatesService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const blockedDatesService = createMockBlockedDatesService()
const url = '/block-visit-dates'

beforeEach(() => {
  app = appWithAllRoutes({ services: { blockedDatesService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Block visit dates listing page', () => {
  describe(`GET ${url}`, () => {
    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should display block visit dates page with a blocked dates listed', () => {
      const today = new Date()
      const tomorrow = addDays(today, 1)
      const nextWeek = addWeeks(today, 1)
      const blockedDate1 = TestData.excludeDateDto({ excludeDate: format(tomorrow, 'yyyy-MM-dd') })
      const blockedDate2 = TestData.excludeDateDto({ excludeDate: format(nextWeek, 'yyyy-MM-dd') })

      blockedDatesService.getFutureBlockedDates.mockResolvedValue([blockedDate1, blockedDate2])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('h1').text()).toBe('Block visit dates')

          expect($('.moj-alert').length).toBe(0)

          expect($('.moj-datepicker').attr('data-min-date')).toBe(format(today, 'dd/MM/yyyy'))
          expect($('.moj-datepicker').attr('data-excluded-dates')).toBe(
            `${format(tomorrow, 'dd/MM/yyyy')} ${format(nextWeek, 'dd/MM/yyyy')}`,
          )
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
      blockedDatesService.getFutureBlockedDates.mockResolvedValue([])

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

      blockedDatesService.getFutureBlockedDates.mockResolvedValue([])

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

      blockedDatesService.getFutureBlockedDates.mockResolvedValue([])

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

  describe(`POST ${url}`, () => {
    const datePickerDateFormat = 'd/M/yyyy'
    const expectedDateFormat = 'yyyy-MM-dd'
    const today = new Date()

    beforeEach(() => {
      flashData = { errors: [], formValues: [] }

      sessionData = {} as SessionData
      blockedDatesService.getFutureBlockedDates.mockResolvedValue([])

      app = appWithAllRoutes({ services: { blockedDatesService }, sessionData })
    })

    it('should set date to block in session and redirect to confirmation page for a valid date', () => {
      const inputDate = format(today, datePickerDateFormat)
      const expectedOutputDate = format(today, expectedDateFormat)

      return request(app)
        .post(url)
        .send({ date: inputDate })
        .expect(302)
        .expect('location', '/block-visit-dates/block-new-date')
        .expect(() => {
          expect(blockedDatesService.getFutureBlockedDates).toHaveBeenCalledWith('HEI', 'user1')
          expect(sessionData.visitBlockDate).toBe(expectedOutputDate)
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })

    describe('should set error and redirect back to listing page for an invalid date', () => {
      it.each([
        ['undefined', undefined, ''],
        ['empty string', ' ', ' '],
        ['text', 'NOT A DATE', 'NOT A DATE'],
        ['partial date', '1/2', '1/2'],
        ['wrong format y/m/d', '2000/2/1', '2000/2/1'],
        ['wrong format m/d/y', '1/13/2000', '1/13/2000'],
        ['non-existant date', '31/2/2000', '31/2/2000'],
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
            expect(blockedDatesService.getFutureBlockedDates).not.toHaveBeenCalled()
            expect(sessionData.visitBlockDate).toBe(undefined)
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
          expect(blockedDatesService.getFutureBlockedDates).not.toHaveBeenCalled()
          expect(sessionData.visitBlockDate).toBe(undefined)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { date: inputDate })
        })
    })

    it('should set error and redirect back to listing page when an already-blocked date is entered', () => {
      const inputDate = format(today, datePickerDateFormat)
      const expectedOutputDate = format(today, expectedDateFormat)

      blockedDatesService.getFutureBlockedDates.mockResolvedValue([
        TestData.excludeDateDto({ excludeDate: expectedOutputDate }),
      ])

      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'The date entered is already blocked',
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
          expect(blockedDatesService.getFutureBlockedDates).toHaveBeenCalledWith('HEI', 'user1')
          expect(sessionData.visitBlockDate).toBe(undefined)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { date: inputDate })
        })
    })
  })
})
