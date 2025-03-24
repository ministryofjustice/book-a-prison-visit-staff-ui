import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { ApplicationValidationErrorResponse, Visit } from '../../data/orchestrationApiTypes'
import { createMockAuditService, createMockVisitService } from '../../services/testutils/mocks'
import { SanitisedError } from '../../sanitisedError'

let sessionApp: Express

let flashData: FlashData

const auditService = createMockAuditService()

let visitSessionData: VisitSessionData

const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`${journey.urlPrefix}/check-your-booking`, () => {
    beforeEach(() => {
      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: '1',
          sessionTemplateReference: 'v9d.7ed.7u',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
          availableTables: 1,
          capacity: 30,
          visitRoom: 'room name',
          visitRestriction: 'OPEN',
        },
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
            ],
            address: '123 Street,\nTest Town,\nS1 2QZ',
            banned: false,
          },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
        mainContact: {
          phoneNumber: '0123 456 7890',
          contactName: 'abc',
        },
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
        requestMethod: 'PHONE',
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    describe(`GET ${journey.urlPrefix}/check-your-booking`, () => {
      it('should render all data from the session', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/check-your-booking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/request-method`)
            expect($('h1').text().trim()).toBe('Check the visit details before booking')
            expect($('.test-prisoner-name').text()).toContain('prisoner name')
            expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
            expect($('[data-test="change-date"]').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
            expect($('[data-test="change-time"]').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('.test-visit-type').text()).toContain('Open')
            expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
            expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
            expect($('[data-test="change-visitors"]').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('.test-additional-support').text()).toContain('Wheelchair ramp')
            expect($('.test-additional-support').text()).toContain(
              'Portable induction loop for people with hearing aids',
            )
            expect($('[data-test="change-additional-support"]').attr('href')).toBe(
              `${journey.urlPrefix}/additional-support`,
            )
            expect($('.test-main-contact-name').text()).toContain('abc')
            expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
            expect($('[data-test="change-main-contact"]').attr('href')).toBe(`${journey.urlPrefix}/select-main-contact`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking`)
          })
      })

      it('should render all data from the session with a message for no selected additional support options', () => {
        visitSessionData.visitorSupport = { description: '' }

        return request(sessionApp)
          .get(`${journey.urlPrefix}/check-your-booking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Check the visit details before booking')
            expect($('.test-prisoner-name').text()).toContain('prisoner name')
            expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
            expect($('[data-test="change-date"]').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
            expect($('[data-test="change-time"]').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
            expect($('.test-visit-type').text()).toContain('Open')
            expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
            expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
            expect($('[data-test="change-visitors"]').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('.test-additional-support').text()).toContain('None')
            expect($('[data-test="change-additional-support"]').attr('href')).toBe(
              `${journey.urlPrefix}/additional-support`,
            )
            expect($('.test-main-contact-name').text()).toContain('abc')
            expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
            expect($('[data-test="change-main-contact"]').attr('href')).toBe(`${journey.urlPrefix}/select-main-contact`)
            expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking`)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/check-your-booking`, () => {
      const visitService = createMockVisitService()

      beforeEach(() => {
        const bookedVisit: Partial<Visit> = {
          applicationReference: visitSessionData.applicationReference,
          reference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        }

        visitService.bookVisit = jest.fn().mockResolvedValue(bookedVisit)

        sessionApp = appWithAllRoutes({
          services: { auditService, visitService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })
      })

      it('should book visit, record audit event and redirect to confirmation page', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/check-your-booking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/confirmation`)
          .expect(() => {
            expect(visitService.bookVisit).toHaveBeenCalledWith({
              username: 'user1',
              applicationReference: visitSessionData.applicationReference,
              applicationMethod: visitSessionData.requestMethod,
              allowOverBooking: false,
            })

            expect(visitService.cancelVisit).not.toHaveBeenCalled()
            expect(visitSessionData.visitStatus).toBe('BOOKED')
            expect(visitSessionData.visitReference).toBe('ab-cd-ef-gh')
            expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.bookedVisit).toHaveBeenCalledWith({
              applicationReference: visitSessionData.applicationReference,
              visitReference: visitSessionData.visitReference,
              prisonerId: visitSessionData.prisoner.offenderNo,
              prisonId: 'HEI',
              visitorIds: [visitSessionData.visitors[0].personId.toString()],
              startTimestamp: '2022-03-12T09:30:00',
              endTimestamp: '2022-03-12T10:30:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should set validation errors in flash and redirect if no overbooking option selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/check-your-booking/overbooking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/check-your-booking/overbooking`)
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

      describe('Handle API errors', () => {
        describe('HTTP 422 Response', () => {
          it('should redirect to confirm overbooking page if no_slot_capacity 422 received', () => {
            const error: SanitisedError<ApplicationValidationErrorResponse> = {
              name: 'Error',
              status: 422,
              message: 'Unprocessable Entity',
              stack: 'Error: Unprocessable Entity',
              data: { status: 422, validationErrors: ['APPLICATION_INVALID_NO_SLOT_CAPACITY'] },
            }
            visitService.bookVisit.mockRejectedValue(error)

            return request(sessionApp)
              .post(`${journey.urlPrefix}/check-your-booking`)
              .expect(302)
              .expect('location', `${journey.urlPrefix}/check-your-booking/overbooking`)
              .expect(() => {
                expect(visitSessionData.visitStatus).not.toBe('BOOKED')
                expect(visitSessionData.visitReference).toBe(journey.isUpdate ? 'ab-cd-ef-gh' : undefined)
                expect(auditService.bookedVisit).not.toHaveBeenCalled()
              })
          })
        })

        it('should handle booking failure, display error message and NOT record audit event', () => {
          visitService.bookVisit.mockRejectedValue({})

          return request(sessionApp)
            .post(`${journey.urlPrefix}/check-your-booking`)
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
              const $ = cheerio.load(res.text)
              expect($('h1').text().trim()).toBe('Check the visit details before booking')
              expect($('.govuk-error-summary__body').text()).toContain('Failed to book this visit')
              expect($('.test-prisoner-name').text()).toContain('prisoner name')
              expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
              expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
              expect($('.test-visit-type').text()).toContain('Open')
              expect($('form').prop('action')).toBe(`${journey.urlPrefix}/check-your-booking`)

              expect(visitService.bookVisit).toHaveBeenCalledWith({
                username: 'user1',
                applicationReference: visitSessionData.applicationReference,
                applicationMethod: visitSessionData.requestMethod,
                allowOverBooking: false,
              })

              expect(visitSessionData.visitStatus).not.toBe('BOOKED')
              expect(visitSessionData.visitReference).toBe(journey.isUpdate ? 'ab-cd-ef-gh' : undefined)
              expect(auditService.bookedVisit).not.toHaveBeenCalled()
            })
        })
      })
    })
  })
})
