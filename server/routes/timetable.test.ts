import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import TestData from './testutils/testData'
import { createMockVisitSessionsService } from '../services/testutils/mocks'

let app: Express

const visitSessionsService = createMockVisitSessionsService()

beforeEach(() => {
  visitSessionsService.getSessionSchedule.mockResolvedValue([])
  app = appWithAllRoutes({ services: { visitSessionsService } })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('View visits timetable', () => {
  let fakeDate: string

  it('should render the visits timetable page with current date selected by default, with empty schedule', () => {
    fakeDate = '2022-12-27' // a Tuesday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('.govuk-breadcrumbs li').length).toBe(2)
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
          'https://request-changes-to-the-visits-timetable.form.service.justice.gov.uk/',
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

  it('should render the visits timetable page with the full range of schedule data', () => {
    const sessionSchedule = [
      TestData.sessionSchedule({
        capacity: { open: 11, closed: 22 },
        weeklyFrequency: 3,
        sessionDateRange: { validFromDate: '2023-02-01', validToDate: '2025-12-31' },
        prisonerCategoryGroupNames: ['Category A (High Risk)'],
        prisonerIncentiveLevelGroupNames: ['Enhanced'],
        prisonerLocationGroupNames: ['Group 1'],
      }),
    ]

    visitSessionsService.getSessionSchedule.mockResolvedValue(sessionSchedule)

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')
        // Row 0
        expect($('[data-test="schedule-time-1"]').text()).toBe('1:45pm to 3:45pm')
        expect($('[data-test="schedule-type-1"]').text()).toBe('Open')
        expect($('[data-test="schedule-capacity-1"]').text()).toBe('11 tables')
        expect($('[data-test="schedule-attendees-1"]').text().trim()).toBe(
          'Category A (High Risk) prisoners on Enhanced in Group 1',
        )
        expect($('[data-test="schedule-frequency-1"]').text()).toBe('Every 3 weeks')
        expect($('[data-test="schedule-end-date-1"]').text()).toBe('31 December 2025')
        // Row 1
        expect($('[data-test="schedule-time-2"]').text()).toBe('1:45pm to 3:45pm')
        expect($('[data-test="schedule-type-2"]').text()).toBe('Closed')
        expect($('[data-test="schedule-capacity-2"]').text()).toBe('22 tables')
        expect($('[data-test="schedule-attendees-2"]').text().trim()).toBe(
          'Category A (High Risk) prisoners on Enhanced in Group 1',
        )
        expect($('[data-test="schedule-frequency-2"]').text()).toBe('Every 3 weeks')
        expect($('[data-test="schedule-end-date-2"]').text()).toBe('31 December 2025')
      })
  })
})
