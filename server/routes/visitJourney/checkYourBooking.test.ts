import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { Visit } from '../../data/visitSchedulerApiTypes'
import config from '../../config'
import TestData from '../testutils/testData'
import {
  createMockAuditService,
  createMockNotificationsService,
  createMockVisitSessionsService,
} from '../../services/testutils/mocks'

let sessionApp: Express

const auditService = createMockAuditService()

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

const availableSupportTypes = TestData.supportTypes()

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    // @ts-ignore
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
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: 'visitId',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
          availableTables: 1,
          capacity: 30,
          visitRoomName: 'room name',
          visitRestriction: 'OPEN',
        },
        visitors: [
          {
            personId: 123,
            name: 'name last',
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
            address: '123 Street,<br>Test Town,<br>S1 2QZ',
            banned: false,
          },
        ],
        visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'INDUCTION_LOOP' }],
        mainContact: {
          phoneNumber: '0123 456 7890',
          contactName: 'abc',
        },
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
          availableSupportTypes,
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
        visitSessionData.visitorSupport = []

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
      const notificationsService = createMockNotificationsService()
      const visitSessionsService = createMockVisitSessionsService()

      beforeEach(() => {
        const reservedVisit: Partial<Visit> = {
          applicationReference: visitSessionData.applicationReference,
          reference: visitSessionData.visitReference,
          visitStatus: 'RESERVED',
        }
        const bookedVisit: Partial<Visit> = {
          applicationReference: visitSessionData.applicationReference,
          reference: visitSessionData.visitReference,
          visitStatus: 'BOOKED',
        }

        visitSessionsService.changeReservedVisit = jest.fn().mockResolvedValue(reservedVisit)
        visitSessionsService.bookVisit = jest.fn().mockResolvedValue(bookedVisit)
        notificationsService.sendBookingSms = jest.fn().mockResolvedValue({})
        notificationsService.sendUpdateSms = jest.fn().mockResolvedValue({})

        sessionApp = appWithAllRoutes({
          services: { auditService, notificationsService, visitSessionsService },
          sessionData: {
            availableSupportTypes,
            visitSessionData,
          } as SessionData,
        })
      })

      it('should book visit, record audit event, send SMS (notifications enabled) and redirect to confirmation page', () => {
        config.apis.notifications.enabled = true

        return request(sessionApp)
          .post(`${journey.urlPrefix}/check-your-booking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/confirmation`)
          .expect(() => {
            expect(visitSessionsService.changeReservedVisit).toHaveBeenCalledTimes(1)
            expect(visitSessionsService.bookVisit).toHaveBeenCalledTimes(1)

            expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
            expect(visitSessionData.visitStatus).toBe('BOOKED')
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
            expect(notificationsService[journey.isUpdate ? 'sendUpdateSms' : 'sendBookingSms']).toHaveBeenCalledTimes(1)
            expect(notificationsService[journey.isUpdate ? 'sendUpdateSms' : 'sendBookingSms']).toHaveBeenCalledWith({
              phoneNumber: '01234567890',
              visitSlot: visitSessionData.visitSlot,
              prisonName: 'Hewell (HMP)',
              reference: visitSessionData.visitReference,
            })
          })
      })

      it('should handle SMS sending failure', () => {
        config.apis.notifications.enabled = true

        notificationsService.sendBookingSms.mockRejectedValue({})

        return request(sessionApp)
          .post(`${journey.urlPrefix}/check-your-booking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/confirmation`)
          .expect(() => {
            expect(visitSessionsService.changeReservedVisit).toHaveBeenCalledTimes(1)
            expect(visitSessionsService.bookVisit).toHaveBeenCalledTimes(1)

            expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
            expect(visitSessionData.visitStatus).toBe('BOOKED')
            expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
            expect(notificationsService[journey.isUpdate ? 'sendUpdateSms' : 'sendBookingSms']).toHaveBeenCalledTimes(1)
          })
      })

      it('should NOT send SMS if notifications disabled', () => {
        config.apis.notifications.enabled = false

        return request(sessionApp)
          .post(`${journey.urlPrefix}/check-your-booking`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/confirmation`)
          .expect(() => {
            expect(visitSessionsService.changeReservedVisit).toHaveBeenCalledTimes(1)
            expect(visitSessionsService.bookVisit).toHaveBeenCalledTimes(1)

            expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
            expect(visitSessionData.visitStatus).toBe('BOOKED')
            expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
            expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
            expect(notificationsService.sendUpdateSms).not.toHaveBeenCalled()
          })
      })

      it('should handle booking failure, display error message and NOT record audit event nor send SMS', () => {
        config.apis.notifications.enabled = true

        visitSessionsService.bookVisit.mockRejectedValue({})

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

            expect(visitSessionsService.changeReservedVisit).toHaveBeenCalledTimes(1)
            expect(visitSessionsService.bookVisit).toHaveBeenCalledTimes(1)

            expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
            expect(visitSessionData.visitStatus).toBe('RESERVED')
            expect(auditService.bookedVisit).not.toHaveBeenCalled()
            expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
            expect(notificationsService.sendUpdateSms).not.toHaveBeenCalled()
          })
      })
    })
  })
})
