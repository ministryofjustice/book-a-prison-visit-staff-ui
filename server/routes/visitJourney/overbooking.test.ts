import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import {
  createMockAuditService,
  createMockVisitSessionsService,
  createMockVisitService,
} from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { ApplicationDto } from '../../data/orchestrationApiTypes'
import { Restriction } from '../../data/prisonerContactRegistryApiTypes'

let sessionApp: Express
let flashData: FlashData

const auditService = createMockAuditService()
const visitSessionsService = createMockVisitSessionsService()
const visitService = createMockVisitService()

let visitSessionData: VisitSessionData
const prisonId = 'HEI'

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/update-a-visit', isUpdate: true },
]

beforeEach(() => {
  visitSessionData = {
    allowOverBooking: false,
    prisoner: {
      firstName: 'John',
      lastName: 'Smith',
      offenderNo: 'A1234BC',
      location: 'location place',
    },
    prisonId,
    selectedVisitSession: {
      date: '2022-03-12',
      sessionTemplateReference: 'ab-cd-ef',
      startTime: '09:30',
      endTime: '10:30',
      availableTables: 0,
      capacity: 20,
    },
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
  describe(`${journey.urlPrefix}/select-date-and-time/overbooking`, () => {
    beforeEach(() => {
      // visit reference only known on update journey
      visitSessionData.visitReference = journey.isUpdate ? 'ab-cd-ef-gh' : undefined

      flashData = { errors: [], formValues: [], messages: [] }
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
            const bookingsCount =
              visitSessionData.selectedVisitSession.capacity - visitSessionData.selectedVisitSession.availableTables
            expect($('[data-test=bookings-count]').text().trim()).toBe(bookingsCount.toString())
            expect($('[data-test=capacity]').text().trim()).toBe(
              visitSessionData.selectedVisitSession.capacity.toString(),
            )
            expect($('[data-test=visit-time]').text().trim()).toBe('9:30am to 10:30am')
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

      beforeEach(() => {
        flashData = { errors: [], formValues: [], messages: [] }
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
          .send({ confirmOverBooking: 'yes' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.selectedVisitSession).toStrictEqual<VisitSessionData['selectedVisitSession']>({
              date: '2022-03-12',
              sessionTemplateReference: 'ab-cd-ef',
              startTime: '09:30',
              endTime: '10:30',
              availableTables: 0,
              capacity: 20,
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
          .send({ confirmOverBooking: 'no' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(visitSessionData.selectedVisitSession).toBeUndefined()
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
          .send({})
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
      flashData = { errors: [], formValues: [], messages: [] }
      flashProvider.mockImplementation((key: keyof FlashData) => {
        return flashData[key]
      })

      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          firstName: 'prisoner',
          lastName: 'name',
          offenderNo: 'A1234BC',
          location: 'location place',
        },
        prisonId,
        selectedVisitSession: {
          date: '2022-03-12',
          sessionTemplateReference: 'ab-cd-ef',
          startTime: '09:30',
          endTime: '10:30',
          availableTables: 0,
          capacity: 20,
        },
        visitRestriction: 'OPEN',
        visitorIds: [123],
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
            ] as Restriction[],
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
        flashData.messages = [TestData.mojAlert()]

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
            expect($('[data-test=capacity]').text().trim()).toBe(visitSession.openVisitCapacity.toString())
            expect($('[data-test=visit-time]').text().trim()).toBe('9:30am to 10:30am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Saturday 12 March')
            expect($('.moj-alert__content h2').text()).toContain('Another person has booked the last table.')
            expect($('.moj-alert').text()).toContain('Select whether to book for this time or choose a new visit time.')
          })
      })

      it('should render the confirm overbooking page with all session information (Closed)', () => {
        const visitSession = TestData.visitSession({ closedVisitBookedCount: 10, closedVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        visitSessionData.visitRestriction = 'CLOSED'
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
            expect($('[data-test=capacity]').text().trim()).toBe(visitSession.closedVisitCapacity.toString())
            expect($('[data-test=visit-time]').text().trim()).toBe('9:30am to 10:30am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Saturday 12 March')
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
            expect(flashProvider).toHaveBeenCalledWith('messages')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })
    })
  })
})
