import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import config from '../config'
import VisitSessionsService from '../services/visitSessionsService'
import TestData from './testutils/testData'

jest.mock('../services/visitSessionsService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<VisitSessionsService>

beforeEach(() => {
  visitSessionsService.getSessionSchedule.mockResolvedValue([])

  app = appWithAllRoutes({ visitSessionsServiceOverride: visitSessionsService })

  config.features.viewTimetableEnabled = true
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('View visits timetable', () => {
  let fakeDate: string

  it('should return a 404 if the feature is disabled', () => {
    config.features.viewTimetableEnabled = false
    app = appWithAllRoutes({})

    return request(app).get('/timetable').expect(404)
  })

  it('should render the visits timetable page with current date selected by default, with empty schedule', () => {
    fakeDate = '2022-12-27' // a Tuesday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('#selected-date').text()).toBe('Tuesday 27 December 2022')

        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Tue\s+27 December/)
        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-26')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-30')
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')

        expect($('[data-test="empty-schedule"]').text()).toBe('No visit sessions on this day.')

        expect($('[data-test="change-timetable"]').text()).toBe('Request changes to the timetable')
        expect($('[data-test="change-request"]').attr('href')).toBe(
          'https://request-visit-schedule-change.form.service.justice.gov.uk',
        )

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          prisonId: 'HEI',
          date: fakeDate,
          username: 'user1',
        })
      })
  })

  it('should render the visits timetable page with requested date selected', () => {
    fakeDate = '2022-12-30' // a Friday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .query({ date: fakeDate })
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('#selected-date').text()).toBe('Friday 30 December 2022')

        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-26')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-27')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Fri\s+30 December/)
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          prisonId: 'HEI',
          date: fakeDate,
          username: 'user1',
        })
      })
  })

  it('should render the visits timetable page with current date selected by default when invalid date requested', () => {
    fakeDate = '2022-12-26' // a Monday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .query({ date: 'NOT A DATE!' })
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('#selected-date').text()).toBe('Monday 26 December 2022')

        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Mon\s+26 December/)
        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-27')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-30')
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          prisonId: 'HEI',
          date: fakeDate,
          username: 'user1',
        })
      })
  })

  it('should render the visits timetable page with that selectedDates timetable shown', () => {
    const sessionSchedule = [
      TestData.sessionSchedule(), // Row 0
      TestData.sessionSchedule({ sessionTemplateFrequency: 'BI_WEEKLY' }), // Row 1
      TestData.sessionSchedule({ prisonerLocationGroupNames: ['Group 1', 'Group 2'] }), // Row 2
      TestData.sessionSchedule({ capacity: { open: 11, closed: 22 } }), // Row 3 + 4
      TestData.sessionSchedule({ startTime: '15:00' }), // Row 5
      TestData.sessionSchedule({ sessionTemplateEndDate: '2025-12-31' }), // Row 6
    ]
    visitSessionsService.getSessionSchedule.mockResolvedValue(sessionSchedule)

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')
        // Row 0
        expect($('[data-test="schedule-time-0"]').text()).toBe('1:45pm to 3:45pm')
        expect($('[data-test="schedule-type-0"]').text()).toBe('Open')
        expect($('[data-test="schedule-capacity-0"]').text()).toBe('40 tables')
        expect($('[data-test="schedule-attendees-0"]').text()).toBe('All prisoners')
        expect($('[data-test="schedule-frequency-0"]').text()).toBe('Weekly')
        expect($('[data-test="schedule-end-date-0"]').text()).toBe('Not entered')
        // Row 1
        expect($('[data-test="schedule-frequency-1"]').text()).toBe('Fortnightly')
        // Row 2
        expect($('[data-test="schedule-attendees-2"]').text()).toBe('Group 1, Group 2')
        // Row 3 + 4
        expect($('[data-test="schedule-type-3"]').text()).toBe('Open')
        expect($('[data-test="schedule-capacity-3"]').text()).toBe('11 tables')
        expect($('[data-test="schedule-type-4"]').text()).toBe('Closed')
        expect($('[data-test="schedule-capacity-4"]').text()).toBe('22 tables')
        // Row 5
        expect($('[data-test="schedule-time-5"]').text()).toBe('3pm to 3:45pm')
        // Row 6
        expect($('[data-test="schedule-end-date-6"]').text()).toBe('31 December 2025')
      })
  })
})