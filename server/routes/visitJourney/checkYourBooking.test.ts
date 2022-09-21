import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import VisitSessionsService from '../../services/visitSessionsService'
import AuditService from '../../services/auditService'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { SupportType, Visit } from '../../data/visitSchedulerApiTypes'
import config from '../../config'
import NotificationsService from '../../services/notificationsService'

jest.mock('../../services/visitSessionsService')
jest.mock('../../services/auditService')

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
const auditService = new AuditService() as jest.Mocked<AuditService>

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

const availableSupportTypes: SupportType[] = [
  {
    type: 'WHEELCHAIR',
    description: 'Wheelchair ramp',
  },
  {
    type: 'INDUCTION_LOOP',
    description: 'Portable induction loop for people with hearing aids',
  },
  {
    type: 'BSL_INTERPRETER',
    description: 'British Sign Language (BSL) Interpreter',
  },
  {
    type: 'MASK_EXEMPT',
    description: 'Face covering exemption',
  },
  {
    type: 'OTHER',
    description: 'Other',
  },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/book-a-visit/check-your-booking', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
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
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  describe('GET /book-a-visit/check-your-booking', () => {
    it('should render all data from the session', () => {
      return request(sessionApp)
        .get('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('Wheelchair ramp')
          expect($('.test-additional-support').text()).toContain('Portable induction loop for people with hearing aids')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')
        })
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      visitSessionData.visitorSupport = []

      return request(sessionApp)
        .get('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('None')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')
        })
    })
  })

  describe('POST /book-a-visit/check-your-booking', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken,
    ) as jest.Mocked<VisitSessionsService>

    const notificationsService = new NotificationsService(null) as jest.Mocked<NotificationsService>

    beforeEach(() => {
      const bookedVisit: Partial<Visit> = { reference: visitSessionData.visitReference, visitStatus: 'BOOKED' }

      visitSessionsService.updateVisit = jest.fn().mockResolvedValue(bookedVisit)
      notificationsService.sendBookingSms = jest.fn().mockResolvedValue({})

      sessionApp = appWithAllRoutes({
        auditServiceOverride: auditService,
        notificationsServiceOverride: notificationsService,
        visitSessionsServiceOverride: visitSessionsService,
        systemTokenOverride: systemToken,
        sessionData: {
          availableSupportTypes,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should book visit, record audit event, send SMS (notifications enabled) and redirect to confirmation page', () => {
      config.apis.notifications.enabled = true

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.bookedVisit).toHaveBeenCalledWith(
            visitSessionData.visitReference,
            visitSessionData.prisoner.offenderNo,
            'HEI',
            [visitSessionData.visitors[0].personId.toString()],
            '2022-03-12T09:30:00',
            '2022-03-12T10:30:00',
            'OPEN',
            undefined,
            undefined,
          )
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledWith({
            phoneNumber: '01234567890',
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
        })
    })

    it('should handle SMS sending failure', () => {
      config.apis.notifications.enabled = true

      notificationsService.sendBookingSms.mockRejectedValue({})

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
        })
    })

    it('should NOT send SMS if notifications disabled', () => {
      config.apis.notifications.enabled = false

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
        })
    })

    it('should handle booking failure, display error message and NOT record audit event nor send SMS', () => {
      config.apis.notifications.enabled = true

      visitSessionsService.updateVisit.mockRejectedValue({})

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.govuk-error-summary__body').text()).toContain('Failed to make this reservation')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')

          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('RESERVED')
          expect(auditService.bookedVisit).not.toHaveBeenCalled()
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
        })
    })
  })
})
