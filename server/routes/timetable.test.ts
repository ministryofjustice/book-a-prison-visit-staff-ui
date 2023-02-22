import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import config from '../config'
import VisitSessionsService from '../services/visitSessionsService'

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

  it('should render the visits timetable page with closest Monday selected by default', () => {
    fakeDate = '2022-12-27' // a Tuesday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('#session-date').text()).toBe('Monday 26 December 2022')

        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Mon\s+26 December/)
        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-27')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-30')
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')

        expect($('[data-test="change-timetable"]').text()).toBe('Request changes to the timetable')
        expect($('[data-test="change-request"]').attr('href')).toBe('LINK_TBC')
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

        expect($('#session-date').text()).toBe('Friday 30 December 2022')

        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-26')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-27')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Fri\s+30 December/)
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')
      })
  })

  it('should render the visits timetable page with closest Monday selected when invalid date requested', () => {
    fakeDate = '2022-12-26' // a Monday
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    return request(app)
      .get('/timetable')
      .query({ date: 'NOT A DATE!' })
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        expect($('h1').text()).toBe('Visits timetable')

        expect($('#session-date').text()).toBe('Monday 26 December 2022')

        expect($('.bapv-timetable-dates__date--selected').text().trim()).toMatch(/Mon\s+26 December/)
        expect($('.bapv-timetable-dates__date a').eq(0).attr('href')).toBe('/timetable?date=2022-12-27')
        expect($('.bapv-timetable-dates__date a').eq(1).attr('href')).toBe('/timetable?date=2022-12-28')
        expect($('.bapv-timetable-dates__date a').eq(2).attr('href')).toBe('/timetable?date=2022-12-29')
        expect($('.bapv-timetable-dates__date a').eq(3).attr('href')).toBe('/timetable?date=2022-12-30')
        expect($('.bapv-timetable-dates__date a').eq(4).attr('href')).toBe('/timetable?date=2022-12-31')
        expect($('.bapv-timetable-dates__date a').eq(5).attr('href')).toBe('/timetable?date=2023-01-01')

        expect($('[data-test="previous-week"]').attr('href')).toBe('/timetable?date=2022-12-19')
        expect($('[data-test="next-week"]').attr('href')).toBe('/timetable?date=2023-01-02')
      })
  })
})
