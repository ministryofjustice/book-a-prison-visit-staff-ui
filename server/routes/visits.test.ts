import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { format } from 'date-fns'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { FlashData } from '../@types/bapv'
import TestData from './testutils/testData'
import { getParsedDateFromQueryString } from '../utils/utils'
import {
  createMockAuditService,
  createMockPrisonerSearchService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerSearchService = createMockPrisonerSearchService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
  app = appWithAllRoutes({ services: { auditService, prisonerSearchService, visitService, visitSessionsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visits', () => {
  const prisonId = 'HEI'

  const fakeDateTime = new Date('2024-02-01T09:00')
  const today = format(fakeDateTime, 'yyyy-MM-dd')

  const sessionSchedule = [TestData.sessionSchedule({ capacity: { open: 20, closed: 5 } })]
  const visits = [TestData.visitPreview()]

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true, now: fakeDateTime })
    visitSessionsService.getSessionSchedule.mockResolvedValue(sessionSchedule)
    visitService.getVisitsBySessionTemplate.mockResolvedValue(visits)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render date tabs, side-nav and visits for default date (today)', () => {
    return request(app)
      .get('/visits')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')

        // date tabs
        expect($('.moj-sub-navigation__link').length).toBe(3)
        expect($('.moj-sub-navigation__link').eq(0).text()).toBe('Thursday 1 February 2024')
        expect($('.moj-sub-navigation__link').eq(0).attr('href')).toBe(
          '/visits?selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )
        expect($('.moj-sub-navigation__link').eq(0).attr('aria-current')).toBe('page')

        expect($('.moj-sub-navigation__link').eq(1).text()).toBe('Friday 2 February 2024')
        expect($('.moj-sub-navigation__link').eq(1).attr('href')).toBe(
          '/visits?selectedDate=2024-02-02&firstTabDate=2024-02-01',
        )
        expect($('.moj-sub-navigation__link').eq(1).attr('aria-current')).toBe(undefined)

        expect($('.moj-sub-navigation__link').eq(2).text()).toBe('Saturday 3 February 2024')
        expect($('.moj-sub-navigation__link').eq(2).attr('href')).toBe(
          '/visits?selectedDate=2024-02-03&firstTabDate=2024-02-01',
        )
        expect($('.moj-sub-navigation__link').eq(2).attr('aria-current')).toBe(undefined)

        // side-nav
        expect($('.moj-side-navigation h4').eq(0).text()).toBe('Open visits')
        expect($('.moj-side-navigation ul').eq(0).find('a').text()).toBe('1:45pm to 3:45pm')
        expect($('.moj-side-navigation ul').eq(0).find('a').first().attr('href')).toBe(
          '/visits?type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )
        expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
          '/visits?type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )

        expect($('.moj-side-navigation h4').eq(1).text()).toBe('Closed visits')
        expect($('.moj-side-navigation ul').eq(1).find('a').text()).toBe('1:45pm to 3:45pm')
        expect($('.moj-side-navigation ul').eq(1).find('a').first().attr('href')).toBe(
          '/visits?type=CLOSED&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )

        // Visits
        expect($('[data-test="visit-session-heading"]').text().trim()).toBe('Open visits, 1:45pm to 3:45pm')
        expect($('[data-test="visit-tables-booked"]').text().trim()).toBe('1 of 20 tables booked')
        expect($('[data-test="visit-visitors-total"]').text().trim()).toBe('2 visitors')

        expect($('[data-test="prisoner-name"]').eq(0).text().trim()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').eq(0).text().trim()).toBe('A1234BC')
        expect($('[data-test="view-visit-link"]').eq(0).attr('href')).toBe(
          '/visit/ab-cd-ef-gh?query=type%3DOPEN%26sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-01%26firstTabDate%3D2024-02-01&from=visits',
        )

        expect($('#search-results-none').length).toBe(0)

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          username: 'user1',
          prisonId,
          date: today,
        })
        expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
          username: 'user1',
          reference: sessionSchedule[0].sessionTemplateReference,
          sessionDate: today,
          visitRestrictions: 'OPEN',
        })
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: today,
          prisonId,
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should render date tabs, side-nav and visits for a specific date and closed session', () => {
    return request(app)
      .get('/visits?type=CLOSED&sessionReference=-afe.dcc.0f&selectedDate=2024-02-02&firstTabDate=2024-02-01')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')

        // date tabs
        expect($('.moj-sub-navigation__link').length).toBe(3)
        expect($('.moj-sub-navigation__link').eq(1).attr('aria-current')).toBe('page')

        // side-nav
        expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
          '/visits?type=CLOSED&sessionReference=-afe.dcc.0f&selectedDate=2024-02-02&firstTabDate=2024-02-01',
        )

        // Visits
        expect($('[data-test="visit-session-heading"]').text().trim()).toBe('Closed visits, 1:45pm to 3:45pm')
        expect($('[data-test="visit-tables-booked"]').text().trim()).toBe('1 of 5 tables booked')
        expect($('[data-test="visit-visitors-total"]').text().trim()).toBe('2 visitors')

        expect($('[data-test="prisoner-name"]').eq(0).text().trim()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').eq(0).text().trim()).toBe('A1234BC')
        expect($('[data-test="view-visit-link"]').eq(0).attr('href')).toBe(
          '/visit/ab-cd-ef-gh?query=type%3DCLOSED%26sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-02%26firstTabDate%3D2024-02-01&from=visits',
        )

        expect($('#search-results-none').length).toBe(0)

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          username: 'user1',
          prisonId,
          date: '2024-02-02',
        })
        expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
          username: 'user1',
          reference: sessionSchedule[0].sessionTemplateReference,
          sessionDate: '2024-02-02',
          visitRestrictions: 'CLOSED',
        })
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: '2024-02-02',
          prisonId,
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should render default (today) if invalid query parameters passed', () => {
    return request(app)
      .get('/visits?type=INVALID&sessionReference=REFERENCE&selectedDate=2024-99-01&firstTabDate=2024-99-01')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')

        // date tabs
        expect($('.moj-sub-navigation__link').length).toBe(3)
        expect($('.moj-sub-navigation__link').eq(0).text()).toBe('Thursday 1 February 2024')
        expect($('.moj-sub-navigation__link').eq(0).attr('href')).toBe(
          '/visits?selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )
        expect($('.moj-sub-navigation__link').eq(0).attr('aria-current')).toBe('page')

        // side-nav
        expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
          '/visits?type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
        )

        // Visits
        expect($('[data-test="visit-session-heading"]').text().trim()).toBe('Open visits, 1:45pm to 3:45pm')
        expect($('[data-test="visit-tables-booked"]').text().trim()).toBe('1 of 20 tables booked')
        expect($('[data-test="visit-visitors-total"]').text().trim()).toBe('2 visitors')

        expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
          username: 'user1',
          prisonId,
          date: today,
        })
        expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
          username: 'user1',
          reference: sessionSchedule[0].sessionTemplateReference,
          sessionDate: today,
          visitRestrictions: 'OPEN',
        })
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: today,
          prisonId,
          username: 'user1',
          operationId: undefined,
        })
      })
  })
})

describe('POST /visits', () => {
  it('should redirect to the selected date on the visits page for a valid date', () => {
    const date = '01/02/2023'
    const selectedDateString = getParsedDateFromQueryString('2023-02-01')

    return request(app)
      .post('/visits')
      .send(`date=${date}`)
      .expect(302)
      .expect('location', `/visits?selectedDate=${selectedDateString}&firstTabDate=${selectedDateString}`)
  })

  it('should redirect to the current date on the visits page for an invalid date', () => {
    const date = 'X/Y/20D2'

    return request(app).post('/visits').send(`date=${date}`).expect(302).expect('location', '/visits')
  })
})
