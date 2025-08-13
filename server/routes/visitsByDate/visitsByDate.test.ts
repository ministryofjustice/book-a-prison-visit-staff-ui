import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { format } from 'date-fns'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { getParsedDateFromQueryString } from '../../utils/utils'
import {
  createMockAuditService,
  createMockBlockedDatesService,
  createMockVisitNotificationsService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../../services/testutils/mocks'

let app: Express
let flashData: FlashData

const auditService = createMockAuditService()
const blockedDatesService = createMockBlockedDatesService()
const visitNotificationsService = createMockVisitNotificationsService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  blockedDatesService.isBlockedDate.mockResolvedValue(false)
  visitNotificationsService.dateHasNotifications.mockResolvedValue(false)

  app = appWithAllRoutes({
    services: {
      auditService,
      blockedDatesService,
      visitNotificationsService,
      visitService,
      visitSessionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visits - Visits by date page', () => {
  const prisonId = 'HEI'

  const fakeDateTime = new Date('2024-02-01T09:00')
  const today = format(fakeDateTime, 'yyyy-MM-dd')

  const sessionSchedule = [TestData.sessionSchedule({ capacity: { open: 20, closed: 5 } })]
  const visits = [TestData.visitPreview()]

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true, now: fakeDateTime })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Visits with a session template', () => {
    beforeEach(() => {
      visitSessionsService.getSessionSchedule.mockResolvedValue(sessionSchedule)
      visitService.getVisitsBySessionTemplate.mockResolvedValue(visits)
      visitService.getVisitsWithoutSessionTemplate.mockResolvedValue([])
    })

    it('should render date tabs, side-nav and visits for default date (today)', () => {
      return request(app)
        .get('/visits')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect($('h1').text()).toBe('View visits by date')

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
          expect($('.moj-side-navigation h4').eq(0).text()).toBe('Visits hall')
          expect($('.moj-side-navigation ul').eq(0).find('a').text()).toBe('1:45pm to 3:45pm - Visits hall')
          expect($('.moj-side-navigation ul').eq(0).find('a').first().attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').text()).toBe('Visits hall')
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')

          expect($('[data-test=visit-section-heading-closed]').text().trim()).toBe('Closed visits')
          expect($('[data-test=visit-tables-booked-closed]').text().trim()).toBe('0 of 5 tables reserved')
          expect($('[data-test=visit-visitors-total-closed]').length).toBe(0)
          expect($('[data-test=visits-closed]').length).toBe(0)

          expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
          expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('1 of 20 tables reserved')
          expect($('[data-test=visit-visitors-total-open]').text()).toBe('2 visitors')

          expect($('[data-test=visits-open] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')
          expect($('[data-test=visits-open] [data-test="prisoner-number"]').eq(0).text()).toBe('A1234BC')
          expect($('[data-test=visits-open] [data-test="booked-on"]').eq(0).text()).toBe('1 January at 9am')
          expect($('[data-test=visits-open] [data-test="view-visit-link"]').eq(0).attr('href')).toBe(
            '/visit/ab-cd-ef-gh?query=sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-01%26firstTabDate%3D2024-02-01&from=visits',
          )

          expect($('[data-test=visit-section-heading-unknown]').length).toBe(0)

          expect($('[data-test="no-visits-message"]').length).toBe(0)

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: today,
          })
          expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            reference: sessionSchedule[0].sessionTemplateReference,
            sessionDate: today,
          })
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            sessionDate: today,
          })
          expect(auditService.viewedVisits).toHaveBeenCalledWith({
            viewDate: today,
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render date tabs, side-nav and visits for a specific date and session', () => {
      return request(app)
        .get('/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-02&firstTabDate=2024-02-01')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          // date tabs
          expect($('.moj-sub-navigation__link').length).toBe(3)
          expect($('.moj-sub-navigation__link').eq(1).attr('aria-current')).toBe('page')

          // side-nav
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-02&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').text()).toBe('Visits hall')
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')

          expect($('[data-test=visit-section-heading-closed]').text().trim()).toBe('Closed visits')
          expect($('[data-test=visit-tables-booked-closed]').text().trim()).toBe('0 of 5 tables reserved')
          expect($('[data-test=visit-visitors-total-closed]').length).toBe(0)
          expect($('[data-test=visits-closed]').length).toBe(0)

          expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
          expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('1 of 20 tables reserved')
          expect($('[data-test=visit-visitors-total-open]').text()).toBe('2 visitors')

          expect($('[data-test=visits-open] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')
          expect($('[data-test=visits-open] [data-test="prisoner-number"]').eq(0).text()).toBe('A1234BC')
          expect($('[data-test=visits-open] [data-test="booked-on"]').eq(0).text()).toBe('1 January at 9am')
          expect($('[data-test=visits-open] [data-test="view-visit-link"]').eq(0).attr('href')).toBe(
            '/visit/ab-cd-ef-gh?query=sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-02%26firstTabDate%3D2024-02-01&from=visits',
          )

          expect($('[data-test=visit-section-heading-unknown]').length).toBe(0)

          expect($('[data-test="no-visits-message"]').length).toBe(0)

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: '2024-02-02',
          })
          expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            reference: sessionSchedule[0].sessionTemplateReference,
            sessionDate: '2024-02-02',
          })
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            sessionDate: '2024-02-02',
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
        .get('/visits?sessionReference=REFERENCE&selectedDate=2024-99-01&firstTabDate=2024-99-01')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          // date tabs
          expect($('.moj-sub-navigation__link').length).toBe(3)
          expect($('.moj-sub-navigation__link').eq(0).text()).toBe('Thursday 1 February 2024')
          expect($('.moj-sub-navigation__link').eq(0).attr('href')).toBe(
            '/visits?selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )
          expect($('.moj-sub-navigation__link').eq(0).attr('aria-current')).toBe('page')

          // side-nav
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').text()).toBe('Visits hall')
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')
          expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
          expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('1 of 20 tables reserved')
          expect($('[data-test=visit-visitors-total-open]').text()).toBe('2 visitors')

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: today,
          })
          expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            reference: sessionSchedule[0].sessionTemplateReference,
            sessionDate: today,
          })
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            sessionDate: today,
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

  describe('Visits without a session template - UNKNOWN/migrated visits', () => {
    beforeEach(() => {
      visitSessionsService.getSessionSchedule.mockResolvedValue([])
      visitService.getVisitsBySessionTemplate.mockResolvedValue([])
      visitService.getVisitsWithoutSessionTemplate.mockResolvedValue(visits)
    })

    it('should render date tabs, side-nav and visits for default date (today)', () => {
      return request(app)
        .get('/visits')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

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
          expect($('.moj-side-navigation h4').eq(0).text()).toBe('All visits')
          expect($('.moj-side-navigation ul').eq(0).find('a').text()).toBe('1:45pm to 3:45pm - All visits')
          expect($('.moj-side-navigation ul').eq(0).find('a').first().attr('href')).toBe(
            '/visits?sessionReference=13%3A45-15%3A45&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=13%3A45-15%3A45&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').length).toBe(0)
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')

          expect($('[data-test=visit-section-heading-closed]').length).toBe(0)
          expect($('[data-test=visit-section-heading-open]').length).toBe(0)

          expect($('[data-test=visit-section-heading-unknown]').text().trim()).toBe('All visits')
          expect($('[data-test=visit-tables-booked-unknown]').text().trim()).toBe('1 table reserved')
          expect($('[data-test=visit-visitors-total-unknown]').text()).toBe('2 visitors')

          expect($('[data-test=visits-unknown] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')
          expect($('[data-test=visits-unknown] [data-test="prisoner-number"]').eq(0).text()).toBe('A1234BC')
          expect($('[data-test=visits-unknown] [data-test="booked-on"]').eq(0).text()).toBe('1 January at 9am')
          expect($('[data-test=visits-unknown] [data-test="view-visit-link"]').eq(0).attr('href')).toBe(
            '/visit/ab-cd-ef-gh?query=sessionReference%3D13%253A45-15%253A45%26selectedDate%3D2024-02-01%26firstTabDate%3D2024-02-01&from=visits',
          )

          expect($('[data-test="no-visits-message"]').length).toBe(0)

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: today,
          })
          expect(visitService.getVisitsBySessionTemplate).not.toHaveBeenCalled()
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            sessionDate: today,
          })
          expect(auditService.viewedVisits).toHaveBeenCalledWith({
            viewDate: today,
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render date tabs, side-nav and visits for a specific unknown visits time slot reference', () => {
      return request(app)
        .get('/visits?type=UNKNOWN&sessionReference=13%3A45-15%3A45&selectedDate=2024-02-02&firstTabDate=2024-02-01')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          // date tabs
          expect($('.moj-sub-navigation__link').length).toBe(3)
          expect($('.moj-sub-navigation__link').eq(1).attr('aria-current')).toBe('page')

          // side-nav
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=13%3A45-15%3A45&selectedDate=2024-02-02&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').length).toBe(0)
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')

          expect($('[data-test=visit-section-heading-closed]').length).toBe(0)
          expect($('[data-test=visit-section-heading-open]').length).toBe(0)

          expect($('[data-test=visit-section-heading-unknown]').text().trim()).toBe('All visits')
          expect($('[data-test=visit-tables-booked-unknown]').text().trim()).toBe('1 table reserved')
          expect($('[data-test=visit-visitors-total-unknown]').text()).toBe('2 visitors')

          expect($('[data-test=visits-unknown] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')
          expect($('[data-test=visits-unknown] [data-test="prisoner-number"]').eq(0).text()).toBe('A1234BC')
          expect($('[data-test=visits-unknown] [data-test="booked-on"]').eq(0).text()).toBe('1 January at 9am')
          expect($('[data-test=visits-unknown] [data-test="view-visit-link"]').eq(0).attr('href')).toBe(
            '/visit/ab-cd-ef-gh?query=sessionReference%3D13%253A45-15%253A45%26selectedDate%3D2024-02-02%26firstTabDate%3D2024-02-01&from=visits',
          )

          expect($('[data-test="no-visits-message"]').length).toBe(0)

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: '2024-02-02',
          })
          expect(visitService.getVisitsBySessionTemplate).not.toHaveBeenCalled()
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            prisonId,
            sessionDate: '2024-02-02',
            username: 'user1',
          })
          expect(auditService.viewedVisits).toHaveBeenCalledWith({
            viewDate: '2024-02-02',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })
  })

  describe('Visits both with and without a session template', () => {
    beforeEach(() => {
      blockedDatesService.isBlockedDate.mockResolvedValue(false)
      visitSessionsService.getSessionSchedule.mockResolvedValue(sessionSchedule)
      visitService.getVisitsBySessionTemplate.mockResolvedValue(visits)
      visitService.getVisitsWithoutSessionTemplate.mockResolvedValue(visits)
    })

    it('should render date tabs, side-nav and visits for default date (today)', () => {
      return request(app)
        .get('/visits')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          // date tabs
          expect($('.moj-sub-navigation__link').length).toBe(3)
          expect($('.moj-sub-navigation__link').eq(2).attr('aria-current')).toBe(undefined)

          // side-nav
          expect($('.moj-side-navigation h4').eq(0).text()).toBe('Visits hall')
          expect($('.moj-side-navigation ul').eq(0).find('a').text()).toBe('1:45pm to 3:45pm - Visits hall')
          expect($('.moj-side-navigation ul').eq(0).find('a').first().attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )
          expect($('.moj-side-navigation__item--active a').attr('href')).toBe(
            '/visits?sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )

          expect($('.moj-side-navigation h4').eq(1).text()).toBe('All visits')
          expect($('.moj-side-navigation ul').eq(1).find('a').text()).toBe('1:45pm to 3:45pm - All visits')
          expect($('.moj-side-navigation ul').eq(1).find('a').first().attr('href')).toBe(
            '/visits?sessionReference=13%3A45-15%3A45&selectedDate=2024-02-01&firstTabDate=2024-02-01',
          )

          // Visits
          expect($('[data-test=visit-room-caption]').text()).toBe('Visits hall')
          expect($('[data-test=visit-session-heading]').text()).toBe('Visits from 1:45pm to 3:45pm')

          expect($('[data-test=visit-section-heading-closed]').text().trim()).toBe('Closed visits')
          expect($('[data-test=visit-tables-booked-closed]').text().trim()).toBe('0 of 5 tables reserved')
          expect($('[data-test=visit-visitors-total-closed]').length).toBe(0)
          expect($('[data-test=visits-closed]').length).toBe(0)

          expect($('[data-test=visit-section-heading-open]').text().trim()).toBe('Open visits')
          expect($('[data-test=visit-tables-booked-open]').text().trim()).toBe('1 of 20 tables reserved')
          expect($('[data-test=visit-visitors-total-open]').text()).toBe('2 visitors')

          expect($('[data-test=visits-open] [data-test="prisoner-name"]').eq(0).text()).toBe('Smith, John')

          expect($('[data-test=visit-section-heading-unknown]').length).toBe(0)

          expect($('[data-test="no-visits-message"]').length).toBe(0)

          expect(blockedDatesService.isBlockedDate).not.toHaveBeenCalled()
          expect(visitNotificationsService.dateHasNotifications).not.toHaveBeenCalled()
          expect(visitSessionsService.getSessionSchedule).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            date: today,
          })
          expect(visitService.getVisitsBySessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            reference: sessionSchedule[0].sessionTemplateReference,
            sessionDate: today,
          })
          expect(visitService.getVisitsWithoutSessionTemplate).toHaveBeenCalledWith({
            username: 'user1',
            prisonId,
            sessionDate: today,
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

  describe('blocked dates', () => {
    beforeEach(() => {
      visitSessionsService.getSessionSchedule.mockResolvedValue([])
      visitService.getVisitsBySessionTemplate.mockResolvedValue([])
      visitService.getVisitsWithoutSessionTemplate.mockResolvedValue([])
    })

    it('should show appropriate message if there is no schedule nor visits and it is a blocked date', () => {
      blockedDatesService.isBlockedDate.mockResolvedValue(true)
      visitNotificationsService.dateHasNotifications.mockResolvedValue(false)

      return request(app)
        .get('/visits')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          expect($('[data-test="no-visits-message"]').text().trim()).toBe(
            'This date has been blocked for social visits. There are no existing bookings to cancel.',
          )

          expect(blockedDatesService.isBlockedDate).toHaveBeenCalledWith('HEI', '2024-02-01', 'user1')
          expect(visitNotificationsService.dateHasNotifications).toHaveBeenCalledWith('user1', 'HEI', '2024-02-01')
        })
    })

    it('should show appropriate message if it is an excluded date and there are visits to review', () => {
      blockedDatesService.isBlockedDate.mockResolvedValue(true)
      visitNotificationsService.dateHasNotifications.mockResolvedValue(true)

      return request(app)
        .get('/visits')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('View visits by date')

          expect($('[data-test="no-visits-message"]').text().trim()).toBe(
            'This date has been blocked for social visits. There are existing bookings that need review.',
          )
          expect($('[data-test="no-visits-message"] a').prop('href')).toBe('/review')

          expect(blockedDatesService.isBlockedDate).toHaveBeenCalledWith('HEI', '2024-02-01', 'user1')
          expect(visitNotificationsService.dateHasNotifications).toHaveBeenCalledWith('user1', 'HEI', '2024-02-01')
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
