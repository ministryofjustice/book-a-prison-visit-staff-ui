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
      TestData.sessionSchedule(), // Row 0
      TestData.sessionSchedule({ weeklyFrequency: 2 }), // Row 1
      TestData.sessionSchedule({ prisonerLocationGroupNames: ['Group 1', 'Group 2'] }), // Row 2
      TestData.sessionSchedule({ capacity: { open: 11, closed: 22 }, weeklyFrequency: 3 }), // Row 3 + 4
      TestData.sessionSchedule({
        sessionDateRange: { validFromDate: '2023-02-01', validToDate: '2023-02-01' },
        sessionTimeSlot: { startTime: '15:00', endTime: '15:45' },
        prisonerIncentiveLevelGroupNames: ['Enhanced prisoners'],
        prisonerLocationGroupNames: ['Group 1'],
      }), // Row 5
      TestData.sessionSchedule({
        sessionDateRange: { validFromDate: '2023-02-01', validToDate: '2025-12-31' },
        prisonerIncentiveLevelGroupNames: ['Enhanced prisoners'],
      }), // Row 6
      TestData.sessionSchedule({
        sessionTimeSlot: { startTime: '15:00', endTime: '15:45' },
        prisonerIncentiveLevelGroupNames: ['Super enhanced prisoners'],
        prisonerLocationGroupNames: ['Group 1'],
      }), // Row 7
      TestData.sessionSchedule({
        sessionDateRange: { validFromDate: '2023-02-01', validToDate: '2025-12-31' },
        prisonerIncentiveLevelGroupNames: ['Super enhanced prisoners'],
      }), // Row 8
      TestData.sessionSchedule({ prisonerCategoryGroupNames: ['Category A (High Risk) prisoners'] }), // Row 9
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
        expect($('[data-test="schedule-attendees-0"]').text().trim()).toBe('All prisoners')
        expect($('[data-test="schedule-frequency-0"]').text()).toBe('Every week')
        expect($('[data-test="schedule-end-date-0"]').text()).toBe('Not entered')
        // Row 1
        expect($('[data-test="schedule-frequency-1"]').text()).toBe('Every 2 weeks')
        // Row 2
        expect($('[data-test="schedule-attendees-2"] li').eq(0).text()).toBe('Group 1')
        expect($('[data-test="schedule-attendees-2"] li').eq(1).text()).toBe('Group 2')
        // Row 3 + 4
        expect($('[data-test="schedule-type-3"]').text()).toBe('Open')
        expect($('[data-test="schedule-capacity-3"]').text()).toBe('11 tables')
        expect($('[data-test="schedule-frequency-3"]').text()).toBe('Every 3 weeks')
        expect($('[data-test="schedule-type-4"]').text()).toBe('Closed')
        expect($('[data-test="schedule-capacity-4"]').text()).toBe('22 tables')
        expect($('[data-test="schedule-frequency-3"]').text()).toBe('Every 3 weeks')
        // Row 5
        expect($('[data-test="schedule-time-5"]').text()).toBe('3pm to 3:45pm')
        expect($('[data-test="schedule-attendees-5"] > span').text().trim()).toBe('Enhanced prisoners in:')
        expect($('[data-test="schedule-attendees-5"] li').eq(0).text()).toBe('Group 1')
        expect($('[data-test="schedule-frequency-5"]').text()).toBe('One off')
        // Row 6
        expect($('[data-test="schedule-attendees-6"]').text().trim()).toBe('Enhanced prisoners')
        expect($('[data-test="schedule-end-date-6"]').text()).toBe('31 December 2025')
        // Row 7
        expect($('[data-test="schedule-time-7"]').text()).toBe('3pm to 3:45pm')
        expect($('[data-test="schedule-attendees-7"] > span').text().trim()).toBe('Super enhanced prisoners in:')
        expect($('[data-test="schedule-attendees-7"] li').eq(0).text()).toBe('Group 1')
        // Row 8
        expect($('[data-test="schedule-attendees-8"]').text().trim()).toBe('Super enhanced prisoners')
        expect($('[data-test="schedule-end-date-8"]').text()).toBe('31 December 2025')
        // Row 9
        expect($('[data-test="schedule-attendees-9"]').text().trim()).toBe('Category A (High Risk) prisoners')
      })
  })
})
