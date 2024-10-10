import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitSessionData, VisitSlot } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import {
  createMockAuditService,
  createMockVisitSessionsService,
  createMockVisitService,
} from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { ApplicationDto } from '../../data/orchestrationApiTypes'

let sessionApp: Express

let flashData: FlashData

const auditService = createMockAuditService()
const visitSessionsService = createMockVisitSessionsService()
const visitService = createMockVisitService()

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

beforeEach(() => {
  visitSessionData = {
    allowOverBooking: false,
    prisoner: {
      name: 'John Smith',
      offenderNo: 'A1234BC',
      dateOfBirth: '25 May 1988',
      location: 'location place',
    },
    visitRestriction: 'OPEN',
    visitSlot: {
      id: 'visitId',
      sessionTemplateReference: 'ab-cd-ef',
      prisonId: 'HEI',
      startTimestamp: '2022-03-12T09:30:00',
      endTimestamp: '2022-03-12T10:30:00',
      availableTables: 0,
      capacity: 30,
      visitRoom: 'room name',
      visitRestriction: 'OPEN',
    },
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
  describe(`${journey.urlPrefix}/select-date-and-time/overbooking`, () => {
    beforeEach(() => {
      // visit reference only known on update journey
      visitSessionData.visitReference = journey.isUpdate ? 'ab-cd-ef-gh' : undefined

      flashData = { errors: [], formValues: [] }
      flashProvider.mockImplementation((key: keyof FlashData) => {
        return flashData[key]
      })
    })

    describe(`GET ${journey.urlPrefix}/select-date-and-time/overbooking`, () => {
      it('should render the confirm overbooking page', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/select-date-and-time/overbooking`)
            expect($('[data-test=bookings-count]').text().trim()).toBe(
              (visitSessionData.visitSlot.capacity - visitSessionData.visitSlot.availableTables).toString(),
            )
            expect($('[data-test=max-capacity]').text().trim()).toBe(visitSessionData.visitSlot.capacity.toString())
            expect($('[data-test=visit-start-time]').text().trim()).toBe('9:30am')
            expect($('[data-test=visit-end-time]').text().trim()).toBe('10:30am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Saturday 12 March')
          })
      })

      it('should render the confirm overbooking page with form validation errors', () => {
        flashData.errors = [
          {
            msg: 'No answer selected',
            path: 'confirmOverBooking',
            type: 'field',
            location: 'body',
          },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/select-date-and-time/overbooking`)
            expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
            expect($('.govuk-error-summary__body a').attr('href')).toBe('#confirmOverBooking-error')
            expect($('#confirmOverBooking-error').text()).toContain('No answer selected')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledTimes(1)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/select-date-and-time (Overbooking)`, () => {
      const application: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }
      const prisonId = 'HEI'

      beforeEach(() => {
        flashData = { errors: [], formValues: [] }
        flashProvider.mockImplementation((key: keyof FlashData) => {
          return flashData[key]
        })

        visitService.createVisitApplication = jest.fn().mockResolvedValue(application)
        visitService.createVisitApplicationFromVisit = jest.fn().mockResolvedValue(application)
        visitService.changeVisitApplication = jest.fn()

        sessionApp = appWithAllRoutes({
          services: { auditService, visitService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })
      })
      it('should make reservation when yes is selected on overbooking page, then go to additional support', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time/overbooking`)
          .send('confirmOverBooking=yes')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toStrictEqual(<VisitSlot>{
              id: 'visitId',
              sessionTemplateReference: 'ab-cd-ef',
              prisonId,
              startTimestamp: '2022-03-12T09:30:00',
              endTimestamp: '2022-03-12T10:30:00',
              availableTables: 0,
              capacity: 30,
              visitRoom: 'room name',
              visitRestriction: 'OPEN',
            })
            expect(visitSessionData.applicationReference).toEqual(application.reference)

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

            expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
              visitReference: visitSessionData.visitReference,
              prisonerId: 'A1234BC',
              prisonId,
              visitorIds: ['4323'],
              startTimestamp: '2022-03-12T09:30:00',
              endTimestamp: '2022-03-12T10:30:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })
      it('should not make reservation when no is selected on overbooking page, then redirect to date and time', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time/overbooking`)
          .send('confirmOverBooking=no')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toBeUndefined()
            expect(visitSessionData.applicationReference).toBeUndefined()

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

            expect(auditService.reservedVisit).not.toHaveBeenCalled()
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
      })

      it('should set validation errors in flash and redirect if no overbooking option selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No answer selected',
                path: 'confirmOverBooking',
                type: 'field',
                value: undefined,
              },
            ])
          })
      })
    })
  })

  describe(`${journey.urlPrefix}/check-your-booking/overbooking`, () => {
    beforeEach(() => {
      flashData = { errors: [], formValues: [] }
      flashProvider.mockImplementation((key: keyof FlashData) => {
        return flashData[key]
      })

      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: 'visitId',
          sessionTemplateReference: 'ab-cd-ef',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
          availableTables: 1,
          capacity: 30,
          visitRoom: 'room name',
          visitRestriction: 'OPEN',
        },
        visitors: [
          {
            personId: 123,
            name: 'name last',
            adult: true,
            relationshipDescription: 'relate',
            restrictions: [
              {
                restrictionType: 'AVS',
                restrictionTypeDescription: 'AVS desc',
                startDate: '123',
                expiryDate: '456',
                globalRestriction: false,
                comment: 'comment',
              },
            ],
            address: '123 Street',
            banned: false,
          },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
        requestMethod: 'BY_PRISONER',
      }

      sessionApp = appWithAllRoutes({
        services: { visitSessionsService },
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    describe(`GET ${journey.urlPrefix}/check-your-booking/overbooking`, () => {
      it('should render the confirm overbooking page with all session information (Open)', () => {
        const visitSession = TestData.visitSession({ openVisitBookedCount: 20, openVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        return request(sessionApp)
          .get(`${journey.urlPrefix}/check-your-booking/overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/check-your-booking`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking/overbooking`)
            expect($('[data-test=bookings-count]').text().trim()).toBe(visitSession.openVisitBookedCount.toString())
            expect($('[data-test=max-capacity]').text().trim()).toBe(visitSession.openVisitCapacity.toString())
            expect($('[data-test=visit-start-time]').text().trim()).toBe('10am')
            expect($('[data-test=visit-end-time]').text().trim()).toBe('11am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Friday 14 January')
          })
      })

      it('should render the confirm overbooking page with all session information (Closed)', () => {
        const visitSession = TestData.visitSession({ closedVisitBookedCount: 10, closedVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        visitSessionData.visitSlot.visitRestriction = 'CLOSED'
        return request(sessionApp)
          .get(`${journey.urlPrefix}/check-your-booking/overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/check-your-booking`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking/overbooking`)
            expect($('[data-test=bookings-count]').text().trim()).toBe(visitSession.closedVisitBookedCount.toString())
            expect($('[data-test=max-capacity]').text().trim()).toBe(visitSession.closedVisitCapacity.toString())
            expect($('[data-test=visit-start-time]').text().trim()).toBe('10am')
            expect($('[data-test=visit-end-time]').text().trim()).toBe('11am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Friday 14 January')
          })
      })

      it('should render the confirm overbooking page with form validation errors', () => {
        const visitSession = TestData.visitSession({ openVisitBookedCount: 20, openVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        flashData.errors = [
          {
            msg: 'No answer selected',
            path: 'confirmOverBooking',
            type: 'field',
            location: 'body',
          },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/check-your-booking/overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/check-your-booking`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking/overbooking`)
            expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
            expect($('.govuk-error-summary__body a').attr('href')).toBe('#confirmOverBooking-error')
            expect($('#confirmOverBooking-error').text()).toContain('No answer selected')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledTimes(1)
          })
      })
    })
  })
})
