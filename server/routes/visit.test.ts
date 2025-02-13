import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider, user } from './testutils/appSetup'
import {
  CancelVisitOrchestrationDto,
  NotificationType,
  Visit,
  VisitHistoryDetails,
} from '../data/orchestrationApiTypes'
import { FlashData, PrisonerProfilePage, VisitorListItem, VisitSessionData } from '../@types/bapv'
import { clearSession } from './visitorUtils'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerProfileService,
  createMockPrisonerSearchService,
  createMockPrisonerVisitorsService,
  createMockSupportedPrisonsService,
  createMockVisitNotificationsService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerProfileService = createMockPrisonerProfileService()
const prisonerSearchService = createMockPrisonerSearchService()
const prisonerVisitorsService = createMockPrisonerVisitorsService()
const supportedPrisonsService = createMockSupportedPrisonsService()
const visitNotificationsService = createMockVisitNotificationsService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

const prison = TestData.prison()
const supportedPrisonIds = TestData.supportedPrisonIds()

jest.mock('./visitorUtils', () => {
  const visitorUtils = jest.requireActual('./visitorUtils')
  return {
    ...visitorUtils,
    clearSession: jest.fn((req: Express.Request) => {
      req.session.visitSessionData = visitSessionData as VisitSessionData
    }),
  }
})

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerProfileService,
      prisonerSearchService,
      prisonerVisitorsService,
      visitSessionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/visit/:reference', () => {
  const childBirthYear = new Date().getFullYear() - 5

  const prisoner = TestData.prisoner()

  let visit: Visit
  let visitHistoryDetails: VisitHistoryDetails

  const visitors: VisitorListItem[] = [
    {
      personId: 4321,
      name: 'Jeanette Smith',
      dateOfBirth: '1986-07-28',
      adult: true,
      relationshipDescription: 'Sister',
      address: '123 The Street,\nCoventry',
      restrictions: [
        {
          restrictionType: 'CLOSED',
          restrictionTypeDescription: 'Closed',
          startDate: '2022-01-03',
          globalRestriction: false,
        },
      ],
      banned: false,
    },
    {
      personId: 4322,
      name: 'Anne Smith',
      dateOfBirth: `${childBirthYear}-01-02`,
      adult: false,
      relationshipDescription: 'Niece',
      address: 'Not entered',
      restrictions: [],
      banned: false,
    },
  ]

  const notifications: NotificationType[] = []

  const additionalSupport = 'Wheelchair ramp, Portable induction loop for people with hearing aids'

  beforeEach(() => {
    visit = TestData.visit()
    visitHistoryDetails = TestData.visitHistoryDetails({
      visit,
    })

    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitService.getFullVisitDetails.mockResolvedValue({
      visitHistoryDetails,
      visitors,
      notifications,
      additionalSupport,
    })
    prisonerVisitorsService.getVisitors.mockResolvedValue(visitors)
    supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
    supportedPrisonsService.getPrison.mockResolvedValue(prison)

    visitSessionData = { allowOverBooking: false, prisoner: undefined }

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerProfileService,
        prisonerSearchService,
        prisonerVisitorsService,
        supportedPrisonsService,
        visitService,
        visitSessionsService,
      },
      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('POST /visit/:reference', () => {
    const restriction = TestData.offenderRestriction()
    const alert = TestData.alert({
      alertType: 'X',
      alertTypeDescription: 'Security',
      alertCode: 'XR',
      alertCodeDescription: 'Racist',
      dateCreated: '2022-01-01',
      dateExpires: '2022-01-02',
    })
    beforeEach(() => {
      const prisonerProfile: PrisonerProfilePage = {
        activeAlerts: [alert],
        activeAlertCount: 1,
        flaggedAlerts: [],
        visitsByMonth: new Map(),
        prisonerDetails: {
          prisonerId: 'A1234BC',
          name: 'Smith, John',
          dateOfBirth: '2 April 1975',
          cellLocation: '1-1-C-028',
          prisonName: 'Hewell (HMP)',
          convictedStatus: 'Convicted',
          category: 'Cat C',
          incentiveLevel: 'Standard',
          visitBalances: {
            remainingVo: 1,
            remainingPvo: 0,
            latestIepAdjustDate: '21 April 2021',
            latestPrivIepAdjustDate: '1 December 2021',
            nextIepAdjustDate: '5 May 2021',
            nextPrivIepAdjustDate: '1 January 2022',
          },
        },
      }
      prisonerProfileService.getProfile.mockResolvedValue(prisonerProfile)
      prisonerProfileService.getRestrictions.mockResolvedValue([restriction])
    })

    it('should set up sessionData and redirect to select visitors page', () => {
      visit.applicationReference = undefined
      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith('HEI', 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(visitSessionData).toStrictEqual(<VisitSessionData>{
            allowOverBooking: false,
            prisoner: {
              name: 'Smith, John',
              offenderNo: 'A1234BC',
              dateOfBirth: '1975-04-02',
              location: '1-1-C-028, HMP Hewell',
              activeAlerts: [alert],
              restrictions: [restriction],
            },
            visitSlot: {
              id: '',
              sessionTemplateReference: 'v9d.7ed.7u',
              prisonId: 'HEI',
              startTimestamp: '2022-01-14T10:00:00',
              endTimestamp: '2022-01-14T11:00:00',
              availableTables: 0,
              capacity: undefined,
              visitRoom: 'Visit room 1',
              visitRestriction: 'OPEN',
            },
            originalVisitSlot: {
              id: '',
              sessionTemplateReference: 'v9d.7ed.7u',
              prisonId: 'HEI',
              startTimestamp: '2022-01-14T10:00:00',
              endTimestamp: '2022-01-14T11:00:00',
              availableTables: 0,
              capacity: undefined,
              visitRoom: 'Visit room 1',
              visitRestriction: 'OPEN',
            },
            visitRestriction: 'OPEN',
            visitors: [
              {
                address: '123 The Street,\nCoventry',
                adult: true,
                banned: false,
                dateOfBirth: '1986-07-28',
                name: 'Jeanette Smith',
                personId: 4321,
                relationshipDescription: 'Sister',
                restrictions: [
                  {
                    globalRestriction: false,
                    restrictionType: 'CLOSED',
                    restrictionTypeDescription: 'Closed',
                    startDate: '2022-01-03',
                  },
                ],
              },
              {
                address: 'Not entered',
                adult: false,
                banned: false,
                dateOfBirth: `${childBirthYear}-01-02`,
                name: 'Anne Smith',
                personId: 4322,
                relationshipDescription: 'Niece',
                restrictions: [],
              },
            ],
            visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
            mainContact: {
              contact: visitors[0],
              phoneNumber: '01234 567890',
              email: 'visitor@example.com',
              contactName: 'Jeanette Smith',
            },
            visitReference: 'ab-cd-ef-gh',
          })
        })
    })

    it('should set up sessionData with no visitorSupport and redirect to select visitors page', () => {
      visit.applicationReference = undefined
      visit.visitorSupport = undefined

      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitorSupport).toStrictEqual(<VisitSessionData['visitorSupport']>{
            description: '',
          })
        })
    })

    it('should redirect to /visit/:reference if selected establishment does not match prison for which visit booked', () => {
      const otherPrison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, activeCaseLoadId: otherPrison.prisonId }),
        services: { auditService, supportedPrisonsService, visitService, visitSessionsService },
        sessionData: {
          selectedEstablishment: otherPrison,
        } as SessionData,
      })

      return request(app).post('/visit/ab-cd-ef-gh').expect(302).expect('location', '/visit/ab-cd-ef-gh')
    })

    // default visit is 13 days away so using 14 days for simplicity
    it('should redirect to /visit/:reference/update/confirm-update if visit is less days away than policy notice days', () => {
      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerProfileService,
          prisonerSearchService,
          prisonerVisitorsService,
          supportedPrisonsService,
          visitService,
          visitSessionsService,
        },
        sessionData: {
          selectedEstablishment: { ...prison, policyNoticeDaysMin: 14 },
        } as SessionData,
      })

      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/confirm-update')
    })

    it('should render 400 Bad Request error for invalid visit reference', () => {
      return request(app)
        .post('/visit/12-34-56-78')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })
  })

  describe('GET /visit/:reference/update/confirm-update', () => {
    it('should render the confirm update page', () => {
      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerSearchService,
          prisonerVisitorsService,
          supportedPrisonsService,
          visitService,
          visitSessionsService,
        },
        sessionData: {
          selectedEstablishment: { ...prison, policyNoticeDaysMin: 4 },
        } as SessionData,
      })

      return request(app)
        .get(`/visit/${visit.reference}/update/confirm-update`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toBe(`/visit/${visit.reference}`)
          expect($('h1').text().trim()).toContain('This visit is in less than 4 days.')
          expect($('h1').text().trim()).toContain('Do you want to update the booking?')
          expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh/update/confirm-update')
        })
    })
  })

  describe('POST /visit/:reference/update/confirm-update', () => {
    it('should redirect back to the visit summary if choosing not to proceed with update', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/update/confirm-update')
        .send('confirmUpdate=no')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh')
        .expect(res => {
          expect(visitSessionData).not.toHaveProperty('overrideBookingWindow')
        })
    })

    it('should redirect to select visitors page if choosing to proceed with update', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/update/confirm-update')
        .send('confirmUpdate=yes')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
        .expect(res => {
          expect(visitSessionData.overrideBookingWindow).toBe(true)
        })
    })

    it('should should redirect to confirm update page with errors set if no option selected', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/update/confirm-update')
        .send('confirmUpdate=')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/confirm-update')
        .expect(() => {
          expect(visitSessionData).not.toHaveProperty('overrideBookingWindow')
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No option selected', path: 'confirmUpdate', type: 'field' },
          ])
        })
    })
  })
})

describe('Clear visit notifications', () => {
  describe('GET /visit/:reference/clear-notifications', () => {
    it('should render the clear notifications page', () => {
      return request(app)
        .get('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Are you sure the visit does not need to be updated or cancelled?')
          expect($('.govuk-back-link').attr('href')).toBe('/visit/ab-cd-ef-gh')
          expect($('input[name="clearNotifications"]').length).toBe(2)
          expect($('input[name="clearNotifications"]:checked').length).toBe(0)
          expect($('input[name="clearReason"]').length).toBe(1)
          expect($('input[name="clearReason"]').val()).toBe(undefined)
          expect($('[data-test="submit"]').length).toBe(1)
        })
    })

    it('should render the clear notifications page, showing validation errors and re-populating fields', () => {
      flashData.errors = [
        { msg: 'No answer selected', path: 'clearNotifications' },
        { msg: 'Enter a reason for not changing the booking', path: 'clearReason' },
      ]

      flashData.formValues = [{ clearNotifications: 'yes', clearReason: 'some text' }]

      return request(app)
        .get('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a reason for not changing the booking')
          expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#clearNotifications-error')
          expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#clearReason-error')

          expect($('input[name="clearNotifications"]:checked').val()).toBe('yes')
          expect($('input[name="clearReason"]').val()).toBe('some text')

          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
        })
    })
  })

  describe('POST /visit/:reference/clear-notifications', () => {
    beforeEach(() => {
      visitNotificationsService.ignoreNotifications.mockResolvedValue(TestData.visit())

      app = appWithAllRoutes({ services: { auditService, visitNotificationsService } })
    })

    it('should clear visit notifications and redirect to the booking summary page if YES and reason given', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=yes')
        .send('clearReason=reason')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()

          expect(visitNotificationsService.ignoreNotifications).toHaveBeenCalledWith({
            username: 'user1',
            reference: 'ab-cd-ef-gh',
            ignoreVisitNotificationsDto: { reason: 'reason', actionedBy: 'user1' },
          })

          expect(auditService.dismissedNotifications).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            reason: 'reason',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should NOT clear visit notifications and redirect to the booking summary page if NO selected', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=no')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })

    it('should set validation errors in flash and redirect to self if no reason selected', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/clear-notifications')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'No answer selected',
              path: 'clearNotifications',
              type: 'field',
              value: undefined,
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })

    it('should set validation errors in flash and redirect to self if YES selected and no reason given', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/clear-notifications')
        .send('clearNotifications=yes')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/clear-notifications')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter a reason for not changing the booking',
              path: 'clearReason',
              type: 'field',
              value: '',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { clearNotifications: 'yes', clearReason: '' })
          expect(visitNotificationsService.ignoreNotifications).not.toHaveBeenCalled()
          expect(auditService.dismissedNotifications).not.toHaveBeenCalled()
        })
    })
  })
})

describe('GET /visit/:reference/cancel', () => {
  it('should render the cancellation reasons page with all the reasons and none selected', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')
        expect($('input[name="cancel"]').length).toBe(5)
        expect($('input[name="cancel"]:checked').length).toBe(0)
        expect($('[data-test="visitor_cancelled"]').attr('value')).toBe('VISITOR_CANCELLED')
        expect($('label[for="cancel"]').text().trim()).toBe('Visitor cancelled')
        expect($('[data-test="details_changed_after_booking"]').attr('value')).toBe('DETAILS_CHANGED_AFTER_BOOKING')
        expect($('label[for="cancel-4"]').text().trim()).toBe('Details changed after booking')
        expect($('[data-test="administrative_error"]').attr('value')).toBe('ADMINISTRATIVE_ERROR')
        expect($('label[for="cancel-5"]').text().trim()).toBe('Administrative error')

        expect($('input[name="method"]').length).toBe(4)
        expect($('input[name="method"]').eq(0).prop('value')).toBe('PHONE')
        expect($('input[name="method"]').eq(1).prop('value')).toBe('WEBSITE')
        expect($('input[name="method"]').eq(2).prop('value')).toBe('EMAIL')
        expect($('input[name="method"]').eq(3).prop('value')).toBe('IN_PERSON')
        expect($('input[name="method"]:checked').length).toBe(0)

        expect($('[data-test="cancel-booking"]').length).toBe(1)
      })
  })

  it('should render the cancellation reasons page, showing validation errors and re-populating fields', () => {
    flashData.errors = [
      { msg: 'No answer selected', path: 'cancel' },
      { msg: 'No request method selected', path: 'method' },
      { msg: 'Enter a reason', path: 'reason' },
    ]

    flashData.formValues = [{ cancel: 'VISITOR_CANCELLED', method: 'EMAIL', reason: 'illness' }]

    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')

        expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
        expect($('.govuk-error-summary__body').text()).toContain('No request method selected')
        expect($('.govuk-error-summary__body').text()).toContain('Enter a reason')
        expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#cancel-error')
        expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#method-error')
        expect($('.govuk-error-summary__body a').eq(2).attr('href')).toBe('#reason-error')

        expect($('input[name="cancel"][value="VISITOR_CANCELLED"]').prop('checked')).toBe(true)
        expect($('input[name="method"][value="EMAIL"]').prop('checked')).toBe(true)
        expect($('input[name="reason"]').val()).toBe('illness')

        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /visit/:reference/cancel', () => {
  let cancelledVisit: Visit
  beforeEach(() => {
    cancelledVisit = TestData.visit()

    visitService.cancelVisit = jest.fn().mockResolvedValue(cancelledVisit)
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
    supportedPrisonsService.getPrison.mockResolvedValue(prison)

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerSearchService,
        supportedPrisonsService,
        visitService,
      },
    })
  })

  it('should cancel visit (default method NOT_APPLICABLE), set flash values and redirect to confirmation page', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .send('reason=++illness++')
      .expect(302)
      .expect('location', '/visit/cancelled')
      .expect(() => {
        expect(visitService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(visitService.cancelVisit).toHaveBeenCalledWith({
          username: 'user1',
          reference: 'ab-cd-ef-gh',
          cancelVisitDto: <CancelVisitOrchestrationDto>{
            cancelOutcome: {
              outcomeStatus: 'PRISONER_CANCELLED',
              text: 'illness',
            },
            applicationMethodType: 'NOT_APPLICABLE',
            actionedBy: 'user1',
            userType: 'STAFF',
          },
        })
        expect(flashProvider).toHaveBeenCalledWith('startTimestamp', cancelledVisit.startTimestamp)
        expect(flashProvider).toHaveBeenCalledWith('endTimestamp', cancelledVisit.endTimestamp)
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          reason: 'PRISONER_CANCELLED: illness',
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should capture the request method if VISITOR_CANCELLED', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=VISITOR_CANCELLED')
      .send('method=EMAIL')
      .send('reason=++illness++')
      .expect(302)
      .expect('location', '/visit/cancelled')
      .expect(() => {
        expect(visitService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(visitService.cancelVisit).toHaveBeenCalledWith({
          username: 'user1',
          reference: 'ab-cd-ef-gh',
          cancelVisitDto: <CancelVisitOrchestrationDto>{
            cancelOutcome: {
              outcomeStatus: 'VISITOR_CANCELLED',
              text: 'illness',
            },
            applicationMethodType: 'EMAIL',
            actionedBy: 'user1',
            userType: 'STAFF',
          },
        })
      })
  })

  it('should set validation errors in flash and redirect if no reason selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', path: 'cancel', type: 'field', value: undefined },
          {
            location: 'body',
            msg: 'Enter a reason for the cancellation',
            path: 'reason',
            type: 'field',
            value: '',
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { reason: '' })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })

  it('should set validation errors in flash and redirect if VISITOR_CANCELLED and no method selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=VISITOR_CANCELLED')
      .send('reason=illness')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request method selected', path: 'method', type: 'field', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { cancel: 'VISITOR_CANCELLED', reason: 'illness' })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })

  it('should set validation errors in flash and redirect if no reason text entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Enter a reason for the cancellation',
            path: 'reason',
            type: 'field',
            value: '',
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          cancel: 'PRISONER_CANCELLED',
          reason: '',
        })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })

  it('should set validation errors in flash and redirect if invalid data entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=INVALID_VALUE')
      .send('reason=illness')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', path: 'cancel', type: 'field', value: 'INVALID_VALUE' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          cancel: 'INVALID_VALUE',
          reason: 'illness',
        })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })
})

describe('GET /visit/cancelled', () => {
  it('should render the booking cancelled page with details of the visit', () => {
    flashData.startTimestamp = ['2022-02-09T10:15:00']
    flashData.endTimestamp = ['2022-02-09T11:00:00']

    return request(app)
      .get('/visit/cancelled')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Booking cancelled')
        expect($('[data-test="visit-details"]').text().trim()).toBe('10:15am to 11am on Wednesday 9 February 2022')
        expect($('[data-test="go-to-home"]').length).toBe(1)

        expect(clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
