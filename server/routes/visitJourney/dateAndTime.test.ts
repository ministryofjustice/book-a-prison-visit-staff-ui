import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { ApplicationDto } from '../../data/orchestrationApiTypes'
import {
  createMockAuditService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../../services/testutils/mocks'
import { CalendarDay, CalendarVisitSession } from '../../services/visitSessionsService'

let sessionApp: Express
let flashData: FlashData

const auditService = createMockAuditService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

const prisonId = 'HEI'

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/update-a-visit', isUpdate: true },
]

const calendarVisitSession1: CalendarVisitSession = {
  date: '2025-08-31',
  sessionTemplateReference: 'a',
  daySection: 'morning',
  startTime: '10:00',
  endTime: '11:00',
  visitRoom: 'Visit room',
  availableTables: 18,
  capacity: 20,
  sessionConflicts: [],
  disabled: false,
}

const calendarVisitSession2: CalendarVisitSession = {
  date: '2025-08-31',
  sessionTemplateReference: 'b',
  daySection: 'afternoon',
  startTime: '13:00',
  endTime: '14:00',
  visitRoom: 'Visit room',
  availableTables: 15,
  capacity: 25,
  sessionConflicts: [],
  disabled: false,
}

const calendarDay: CalendarDay = {
  date: '2025-08-31',
  monthHeading: 'August',
  selected: false,
  outline: false,
  visitSessions: [],
  scheduledEvents: [],
}

beforeEach(() => {
  flashData = { errors: [], formValues: [], messages: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  visitSessionData = {
    allowOverBooking: undefined,
    prisoner: {
      firstName: 'John',
      lastName: 'Smith',
      offenderNo: 'A1234BC',
      location: '1-1-C-028',
    },
    prisonId,
    visitRestriction: 'OPEN',
    visitorIds: [4323],
    visitors: [
      {
        personId: 4323,
        name: 'Ted Smith',
        dateOfBirth: '1968-07-28',
        adult: true,
        relationshipDescription: 'Father',
        address: '1st listed address',
        restrictions: [],
        banned: false,
      },
    ],
  }

  sessionApp = appWithAllRoutes({
    services: { visitSessionsService },
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`Select date and time: ${journey.urlPrefix}/select-date-and-time`, () => {
    beforeEach(() => {
      // visit reference only known on update journey
      visitSessionData.visitReference = journey.isUpdate ? 'ab-cd-ef-gh' : undefined
      visitSessionData.originalVisitSession = journey.isUpdate
        ? {
            date: calendarVisitSession1.date,
            sessionTemplateReference: calendarVisitSession1.sessionTemplateReference,
            startTime: calendarVisitSession1.startTime,
            endTime: calendarVisitSession1.endTime,
            visitRestriction: 'OPEN',
          }
        : undefined

      calendarDay.visitSessions = [calendarVisitSession1, calendarVisitSession2]

      visitSessionsService.getVisitSessionsAndScheduleCalendar.mockResolvedValue({
        calendar: [calendarDay],
        scheduledEventsAvailable: true,
      })
    })

    describe(`GET ${journey.urlPrefix}/select-date-and-time`, () => {
      it('should render the calendar with visit session, save visit sessions to session and reset overbooking flag', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            // Page header
            expect($('title').text()).toMatch(/^Select date and time of visit -/)
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('.moj-alert').length).toBe(0)
            expect($('h1').text().trim()).toBe('Select date and time of visit')

            // Prisoner info
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028')
            expect($('[data-test="visit-restriction"]').text()).toBe('Open')

            // Calendar key
            expect($('[data-test=booking-days-ahead]').text()).toBe('28')

            // No events unavailable message
            expect($('[data-test=prisoner-schedule-unavailable]').length).toBe(0)

            // Form, visit sessions and button
            expect($('form').attr('action')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('input[name=visitSessionId]').length).toBe(2)
            expect($('input#date-2025-08-31-morning').val()).toBe('2025-08-31_a')
            expect($('input#date-2025-08-31-morning').prop('disabled')).toBe(false)
            expect($('input#date-2025-08-31-morning').prop('checked')).toBe(journey.isUpdate) // checked on update as original pre-selected
            expect($('label[for=date-2025-08-31-morning]').text()).toContain('10am to 11am')
            expect($('label[for=date-2025-08-31-morning]').text()).toContain('Visit room')
            expect($('label[for=date-2025-08-31-morning]').text()).toContain('18 tables available')

            expect($('input#date-2025-08-31-afternoon').val()).toBe('2025-08-31_b')
            expect($('input#date-2025-08-31-afternoon').prop('disabled')).toBe(false)
            expect($('input#date-2025-08-31-afternoon').prop('checked')).toBe(false)
            expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('1pm to 2pm')
            expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('Visit room')
            expect($('label[for=date-2025-08-31-afternoon]').text()).toContain('15 tables available')

            expect($('[data-test=submit]').text().trim()).toBe('Continue')

            expect(visitSessionsService.getVisitSessionsAndScheduleCalendar).toHaveBeenCalledWith({
              username: 'user1',
              prisonId,
              prisonerId: visitSessionData.prisoner.offenderNo,
              minNumberOfDays: 3,
              visitRestriction: visitSessionData.visitRestriction,
              selectedVisitSession: visitSessionData.selectedVisitSession,
              originalVisitSession: visitSessionData.originalVisitSession,
            })

            expect(visitSessionData.allowOverBooking).toBe(false)
            expect(visitSessionData.allVisitSessions).toStrictEqual([calendarVisitSession1, calendarVisitSession2])
          })
      })

      it('should show message if no sessions are available', () => {
        visitSessionsService.getVisitSessionsAndScheduleCalendar.mockResolvedValue({
          calendar: [],
          scheduledEventsAvailable: true,
        })

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            // Page header
            expect($('title').text()).toMatch(/^A visit cannot be booked -/)
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('.moj-alert').length).toBe(0)
            expect($('h1').text()).toBe('A visit cannot be booked')

            // Prisoner info
            expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
            expect($('[data-test=prisoner-location]').text()).toBe('1-1-C-028')
            expect($('[data-test=visit-restriction]').text()).toBe('Open')

            expect($('[data-test=booking-days-ahead]').length).toBe(0)

            expect($('main').text()).toContain('There are no available visit times')
            expect($('[data-test=back-to-start]').attr('href')).toBe('/back-to-start')
          })
      })

      it('should show warning message when prisoner schedule data is not available', () => {
        visitSessionsService.getVisitSessionsAndScheduleCalendar.mockResolvedValue({
          calendar: [calendarDay],
          scheduledEventsAvailable: false,
        })

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=prisoner-schedule-unavailable]').text()).toContain(
              'The prisoner schedule is unavailable',
            )
          })
      })

      it('should show warning message when visitor ban days set in session is greater than default min booking days', () => {
        visitSessionData.daysUntilBanExpiry = 4 // default minimum booking ahead days is 3 (2 + 1 - to ensure 'full' days)

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.moj-alert').length).toBe(1)
            expect($('.moj-alert').eq(0).text()).toContain('A selected visitor is banned')
            expect($('.moj-alert').eq(0).text()).toContain('Visit times during the period of the ban are not shown.')
          })
      })

      it('should render validation errors from flash data for invalid input', () => {
        flashData.errors = [
          {
            type: 'field',
            msg: 'No visit time selected',
            path: 'date-2025-08-31-morning',
            location: 'body',
          },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.govuk-error-summary a[href="#date-2025-08-31-morning-error"]').text()).toBe(
              'No visit time selected',
            )
            expect($('#date-2025-08-31-morning-error').text()).toContain('No visit time selected')
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/select-date-and-time`, () => {
      const application: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }

      beforeEach(() => {
        visitService.createVisitApplication = jest.fn().mockResolvedValue(application)
        visitService.createVisitApplicationFromVisit = jest.fn().mockResolvedValue(application)
        visitService.changeVisitApplication = jest.fn()

        visitSessionData.allVisitSessions = [calendarVisitSession1, calendarVisitSession2]

        sessionApp = appWithAllRoutes({
          services: { auditService, visitService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })
      })

      it('should save to session, create a visit application, send audit and redirect to additional support page if visit session selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send({ visitSessionId: '2025-08-31_a' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.selectedVisitSession).toStrictEqual<VisitSessionData['selectedVisitSession']>({
              date: '2025-08-31',
              sessionTemplateReference: 'a',
              startTime: '10:00',
              endTime: '11:00',
              availableTables: 18,
              capacity: 20,
            })

            expect(visitSessionData.applicationReference).toEqual(application.reference)

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
              visitReference: visitSessionData.visitReference,
              prisonerId: 'A1234BC',
              prisonId,
              visitorIds: ['4323'],
              startTimestamp: '2025-08-31T10:00:00',
              endTimestamp: '2025-08-31T11:00:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should save new choice to session, update visit application and redirect to additional support page if existing session data present', () => {
        visitSessionData.applicationReference = application.reference

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send({ visitSessionId: '2025-08-31_b' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.selectedVisitSession).toStrictEqual<VisitSessionData['selectedVisitSession']>({
              date: '2025-08-31',
              sessionTemplateReference: 'b',
              startTime: '13:00',
              endTime: '14:00',
              availableTables: 15,
              capacity: 25,
            })

            expect(visitSessionData.applicationReference).toEqual(application.reference)

            expect(visitService.createVisitApplication).not.toHaveBeenCalled()
            expect(visitService.createVisitApplicationFromVisit).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({ username: 'user1', visitSessionData })

            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
              visitReference: visitSessionData.visitReference,
              prisonerId: 'A1234BC',
              prisonId,
              visitorIds: ['4323'],
              startTimestamp: '2025-08-31T13:00:00',
              endTimestamp: '2025-08-31T14:00:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should should set validation errors in flash and redirect if no visit session selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send({})
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No visit time selected',
                path: 'date-2025-08-31-morning',
                type: 'field',
                value: undefined,
              },
            ])
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
      })

      it('should should set validation errors in flash and redirect if invalid visit session selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send({ visitSessionId: '2025-08-31_X' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No visit time selected',
                path: 'date-2025-08-31-morning',
                type: 'field',
                value: '2025-08-31_X',
              },
            ])
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
      })

      it('should redirect to overbooking page if selected visit session has no available tables', () => {
        visitSessionData.allVisitSessions[1] = { ...calendarVisitSession2, availableTables: 0 }

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send({ visitSessionId: '2025-08-31_b' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(() => {
            expect(visitSessionData.selectedVisitSession).toStrictEqual<VisitSessionData['selectedVisitSession']>({
              date: '2025-08-31',
              sessionTemplateReference: 'b',
              startTime: '13:00',
              endTime: '14:00',
              availableTables: 0,
              capacity: 25,
            })
            expect(visitSessionData.applicationReference).toBeUndefined()

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).toHaveBeenCalledTimes(0)
            expect(visitService.changeVisitApplication).toHaveBeenCalledTimes(0)
            expect(auditService.reservedVisit).toHaveBeenCalledTimes(0)
          })
      })
    })
  })
})

describe('Update journey override booking window', () => {
  it('should override booking window min days to 0 if confirmation set in session', () => {
    visitSessionsService.getVisitSessionsAndScheduleCalendar.mockResolvedValue({
      calendar: [],
      scheduledEventsAvailable: true,
    })

    visitSessionData.overrideBookingWindow = true

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(visitSessionsService.getVisitSessionsAndScheduleCalendar).toHaveBeenCalledWith({
          username: 'user1',
          prisonId,
          prisonerId: visitSessionData.prisoner.offenderNo,
          minNumberOfDays: 0,
          visitRestriction: visitSessionData.visitRestriction,
          selectedVisitSession: visitSessionData.selectedVisitSession,
          originalVisitSession: visitSessionData.originalVisitSession,
        })
      })
  })
})

describe('Update journey specific warning messages', () => {
  beforeEach(() => {
    visitSessionData.originalVisitSession = {
      date: calendarVisitSession1.date,
      sessionTemplateReference: calendarVisitSession1.sessionTemplateReference,
      startTime: calendarVisitSession1.startTime,
      endTime: calendarVisitSession1.endTime,
      visitRestriction: 'OPEN',
    }

    calendarDay.visitSessions = [calendarVisitSession1, calendarVisitSession2]
    visitSessionsService.getVisitSessionsAndScheduleCalendar.mockResolvedValue({
      calendar: [calendarDay],
      scheduledEventsAvailable: true,
    })

    visitSessionData.visitReference = 'ab-cd-ef-gh'
  })

  it('should select original visit session with no messages if no restriction change and original time available', () => {
    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('moj-alert').length).toBe(0)
        expect($('input[value=2025-08-31_a]').prop('checked')).toBe(true)
      })
  })

  it('should select original visit session with no messages if no restriction change and original time available but overbooked', () => {
    // Allowing over-booking is OK because the original visit (being updated) is one of the already-booked spaces
    calendarDay.visitSessions[0] = { ...calendarVisitSession1, availableTables: 0 }

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('moj-alert').length).toBe(0)
        expect($('input[value=2025-08-31_a]').prop('checked')).toBe(true)
      })
  })

  it('should show two messages with no visit session selected when visit has changed from open to closed and original visit session unavailable', () => {
    calendarDay.visitSessions = [calendarVisitSession2]
    visitSessionData.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').length).toBe(2)

        expect($('.moj-alert').eq(0).text()).toContain('The prisoner’s information has changed')
        expect($('.moj-alert').eq(0).text()).toContain('Select a new visit time.')

        expect($('.moj-alert').eq(1).text()).toContain('open to closed')
        expect($('.moj-alert').eq(1).text()).toContain('Select a new visit time.')

        expect($('input:checked').length).toBe(0)
      })
  })

  it('should show two messages with no visit session selected when visit has changed from closed to open and original visit session unavailable', () => {
    calendarDay.visitSessions = [calendarVisitSession2]
    visitSessionData.originalVisitSession.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').length).toBe(2)

        expect($('.moj-alert').eq(0).text()).toContain('The prisoner’s information has changed')
        expect($('.moj-alert').eq(0).text()).toContain('Select a new visit time.')

        expect($('.moj-alert').eq(1).text()).toContain('closed to open')
        expect($('.moj-alert').eq(1).text()).toContain('Select a new visit time.')

        expect($('input:checked').length).toBe(0)
      })
  })

  it('should show one message with original visit session selected when visit has changed from open to closed and original visit session available', () => {
    visitSessionData.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').length).toBe(1)
        expect($('.moj-alert').eq(0).text()).toContain('open to closed')
        expect($('.moj-alert').eq(0).text()).toContain('Select a new visit time.')
        expect($('input[value=2025-08-31_a]').prop('checked')).toBe(true)
      })
  })

  it('should show one message with original visit session selected when visit has changed from closed to open and original visit session available', () => {
    visitSessionData.originalVisitSession.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/update-a-visit/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.moj-alert').length).toBe(1)
        expect($('.moj-alert').eq(0).text()).toContain('closed to open')
        expect($('.moj-alert').eq(0).text()).toContain('Select a new visit time.')
        expect($('input[value=2025-08-31_a]').prop('checked')).toBe(true)
      })
  })
})
