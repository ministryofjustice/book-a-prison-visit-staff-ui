import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import {
  CancelVisitOrchestrationDto,
  NotificationType,
  Visit,
  VisitHistoryDetails,
} from '../data/orchestrationApiTypes'
import { FlashData, VisitorListItem, VisitSessionData } from '../@types/bapv'
import { clearSession } from './visitorUtils'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerSearchService,
  createMockPrisonerVisitorsService,
  createMockSupportedPrisonsService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../services/testutils/mocks'
import { notificationTypeWarnings } from '../constants/notificationEvents'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerSearchService = createMockPrisonerSearchService()
const prisonerVisitorsService = createMockPrisonerVisitorsService()
const supportedPrisonsService = createMockSupportedPrisonsService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

const supportedPrisons = TestData.supportedPrisons()
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

// mock can be removed when 'reviewBookings' feature flag is removed
jest.mock('../config', () => {
  return {
    ...jest.requireActual('../config').default,
    features: { reviewBookings: true },
  }
})

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    services: { auditService, prisonerSearchService, prisonerVisitorsService, visitSessionsService },
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
      address: '123 The Street,<br>Coventry',
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

  const additionalSupport = ['Wheelchair ramp', 'custom request']

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
    supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
    supportedPrisonsService.getPolicyNoticeDaysMin.mockResolvedValue(2)

    visitSessionData = { prisoner: undefined }

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
        visitSessionData,
      } as SessionData,
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('GET /visit/:reference', () => {
    it('should render full booking summary page with visit information and prisoner tab selected, with default back link', () => {
      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // visit details
          expect($('[data-test="visit-date-and-time"]').text()).toContain('Friday 14 January 2022, 10am to 11am')
          expect($('[data-test="visit-type"]').text()).toBe('Open')
          expect($('[data-test="visit-contact"]').text()).toBe('Smith, Jeanette')
          expect($('[data-test="visit-phone"]').text()).toBe('01234 567890')
          expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
          expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, HMP Hewell')
          // visitor details - tab selected - check information displayed
          expect($('[data-test="test-visitor-name1"]').text()).toBe('Jeanette Smith (sister of the prisoner)')
          expect($('[data-test="test-visitor-dob1"]').text()).toContain('28 July 1986')
          expect($('[data-test="test-visitor-dob1"]').text()).toContain('(35 years old)')
          expect($('[data-test="test-visitor-address1"]').text()).toBe('123 The Street, Coventry')
          expect($('[data-test="test-visitor-restriction1"]').text()).toContain('Closed')
          expect($('[data-test="additional-support"]').text()).toContain('Wheelchair ramp, custom request')
          // booking history - tab selected - check information displayed
          // first event
          expect($('[data-test="visit-event-1"]').text()).toBe('Needs review')
          expect($('[data-test="visit-actioned-by-1"]').text().trim()).toBe('') // no actioned by on needs review event
          expect($('[data-test="visit-event-date-time-1"]').text()).toBe('Saturday 1 January 2022 at 11am')
          expect($('[data-test="visit-request-method-1"]').length).toBe(0) // no request method on needs review event
          expect($('[data-test="visit-needs-review-description-1"]').text()).toBe('Reason: Non-association')
          // second event
          expect($('[data-test="visit-event-2"]').text()).toBe('Updated')
          expect($('[data-test="visit-actioned-by-2"]').text().trim().replace(/\s+/g, ' ')).toBe('by User Two')
          expect($('[data-test="visit-event-date-time-2"]').text()).toBe('Saturday 1 January 2022 at 10am')
          expect($('[data-test="visit-request-method-2"]').text()).toBe('Request method: Email')
          // third event
          expect($('[data-test="visit-event-3"]').text()).toBe('Booked')
          expect($('[data-test="visit-actioned-by-3"]').text().trim().replace(/\s+/g, ' ')).toBe('by User One')
          expect($('[data-test="visit-event-date-time-3"]').text()).toBe('Saturday 1 January 2022 at 9am')
          expect($('[data-test="visit-request-method-3"]').text()).toBe('Request method: Phone call')

          expect(visitSessionData).toEqual({ prisoner: undefined })

          expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
          expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render full booking summary page with visit information and prisoner tab selected, with default back link, formatting unknown contact telephone correctly', () => {
      visitHistoryDetails.visit.visitContact.telephone = 'UNKNOWN'
      prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
      visitService.getFullVisitDetails.mockResolvedValue({
        visitHistoryDetails,
        visitors,
        notifications,
        additionalSupport,
      })

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
          // visit details
          expect($('[data-test="visit-contact"]').text()).toBe('Smith, Jeanette')
          expect($('[data-test="visit-phone"]').text()).toBe('Unknown')
          expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
          expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')

          expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
          expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render full booking summary page with visit information and prisoner tab selected with search back link when from visits', () => {
      const url =
        '/visit/ab-cd-ef-gh?query=startDate%3D2022-05-24%26type%3DOPEN%26time%3D3pm%2Bto%2B3%253A59pm&from=visit-search'

      prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
      visitService.getFullVisitDetails.mockResolvedValue({
        visitHistoryDetails,
        visitors,
        notifications,
        additionalSupport,
      })

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/visits?startDate=2022-05-24&type=OPEN&time=3pm+to+3%3A59pm')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')

          expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
          expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render booking summary page correct back link when from review listing page', () => {
      const url = '/visit/ab-cd-ef-gh?from=review'

      prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
      visitService.getFullVisitDetails.mockResolvedValue({
        visitHistoryDetails,
        visitors,
        notifications,
        additionalSupport,
      })

      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/review')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')

          expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
          expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render full booking summary page with prisoner location showing as "Unknown" if not a supported prison', () => {
      const transferPrisoner = TestData.prisoner({ prisonId: 'TRN', prisonName: 'Transfer' })

      prisonerSearchService.getPrisonerById.mockResolvedValue(transferPrisoner)

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-location"]').text()).toBe('Unknown')
        })
    })

    it('should render full booking summary page with prisoner location for a RELEASED prisoner', () => {
      const releasedPrisoner = TestData.prisoner({
        prisonId: 'OUT',
        locationDescription: 'Outside - released from HMP HEWELL',
      })

      prisonerSearchService.getPrisonerById.mockResolvedValue(releasedPrisoner)

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-location"]').text()).toBe(releasedPrisoner.locationDescription)
        })
    })

    it('should not show booking summary if selected establishment does not match prison for which visit booked', () => {
      app = appWithAllRoutes({
        services: { auditService, supportedPrisonsService, visitService, visitSessionsService },
        sessionData: {
          selectedEstablishment: { prisonId: 'BLI', prisonName: supportedPrisons.BLI, policyNoticeDaysMin: 2 },
        } as SessionData,
      })

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').length).toBe(0)
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')

          expect(res.text).toContain(`This booking is not for ${supportedPrisons.BLI.replace(/&/g, '&amp;')}`)
          expect(res.text).toContain(`change the establishment to ${supportedPrisons[visit.prisonId]}`)

          expect(auditService.viewedVisitDetails).not.toHaveBeenCalled()
        })
    })

    it('should render 400 Bad Request error for invalid visit reference', () => {
      return request(app)
        .get('/visit/12-34-56-78')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })

    it('should not display update and cancel buttons if visit is cancelled', () => {
      visit.visitStatus = 'CANCELLED'
      visit.outcomeStatus = 'ADMINISTRATIVE_CANCELLATION'
      visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'booking error' }]
      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="cancel-visit"]').length).toBe(0)
          expect($('[data-test="update-visit"]').length).toBe(0)
        })
    })

    it('should not display update and cancel buttons if start date has passed by 29 days', () => {
      const visitDate = new Date(visit.startTimestamp)
      const testDate = visitDate.setDate(visitDate.getDate() + 29)
      jest.useFakeTimers({ advanceTimers: true, now: testDate })
      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="cancel-visit"]').length).toBe(0)
          expect($('[data-test="update-visit"]').length).toBe(0)
        })
    })

    it('should display cancel and not the update button if start date has passed by 27 days', () => {
      const visitDate = new Date(visit.startTimestamp)
      const testDate = visitDate.setDate(visitDate.getDate() + 27)
      jest.useFakeTimers({ advanceTimers: true, now: testDate })
      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="cancel-visit"]').length).toBe(1)
          expect($('[data-test="update-visit"]').length).toBe(0)
        })
    })

    describe('Visit notification messages', () => {
      it('should not display visit notification banner when no notification types set', () => {
        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-notification"]').length).toBe(0)
          })
      })

      it('should display a single visit notification banner when a single notification type is set', () => {
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications: ['PRISONER_RELEASED_EVENT'],
          additionalSupport,
        })

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-notification"]').length).toBe(1)
            expect($('[data-test="visit-notification"]').text()).toBe(notificationTypeWarnings.PRISONER_RELEASED_EVENT)
          })
      })

      it('should display a two visit notification banners when two notification types are set', () => {
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications: ['PRISONER_RELEASED_EVENT', 'PRISON_VISITS_BLOCKED_FOR_DATE'],
          additionalSupport,
        })

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-notification"]').length).toBe(2)
            expect($('[data-test="visit-notification"]').eq(0).text()).toBe(
              notificationTypeWarnings.PRISONER_RELEASED_EVENT,
            )
            expect($('[data-test="visit-notification"]').eq(1).text()).toBe(
              notificationTypeWarnings.PRISON_VISITS_BLOCKED_FOR_DATE,
            )
          })
      })
    })

    describe('Cancellation message', () => {
      it('should display cancelled message - administrative', () => {
        visit.visitStatus = 'CANCELLED'
        visit.outcomeStatus = 'ADMINISTRATIVE_CANCELLATION'
        visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'booking error' }]
        visitHistoryDetails.eventsAudit = [
          {
            type: 'CANCELLED_VISIT',
            applicationMethodType: 'NOT_APPLICABLE',
            actionedBy: 'User Three',
            createTimestamp: '2022-01-01T11:00:00',
          },
        ]
        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-cancelled-type"]').text()).toBe(
              'This visit was cancelled due to an administrative error with the booking.',
            )
            expect($('[data-test="visit-cancelled-reason-1"]').text()).toBe('Reason: booking error')
          })
      })

      it('should display cancelled message - details changed after booking', () => {
        visit.visitStatus = 'CANCELLED'
        visit.outcomeStatus = 'DETAILS_CHANGED_AFTER_BOOKING'
        visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'no longer required' }]
        visitHistoryDetails.eventsAudit = [
          {
            type: 'CANCELLED_VISIT',
            applicationMethodType: 'NOT_APPLICABLE',
            actionedBy: 'User Three',
            createTimestamp: '2022-01-01T11:00:00',
          },
        ]

        return request(app)
          .get('/visit/ab-cd-ef-gh?tab=history')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-cancelled-type"]').text()).toBe(
              'This visit was cancelled as the details changed after booking.',
            )
            expect($('[data-test="visit-event-1"]').text().trim().replace(/\s+/g, ' ')).toBe('Cancelled')
            expect($('[data-test="visit-actioned-by-1"]').text().trim().replace(/\s+/g, ' ')).toBe('by User Three')
            expect($('[data-test="visit-event-date-time-1"]').text().trim().replace(/\s+/g, ' ')).toBe(
              'Saturday 1 January 2022 at 11am',
            )
            expect($('[data-test="visit-cancelled-reason-1"]').text()).toBe('Reason: no longer required')
          })
      })

      it('should display cancelled message - visitor cancelled', () => {
        visit.visitStatus = 'CANCELLED'
        visit.outcomeStatus = 'VISITOR_CANCELLED'
        visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'no longer required' }]
        visitHistoryDetails.eventsAudit = [
          {
            type: 'CANCELLED_VISIT',
            applicationMethodType: 'NOT_APPLICABLE',
            actionedBy: 'User Three',
            createTimestamp: '2022-01-01T11:00:00',
          },
        ]

        return request(app)
          .get('/visit/ab-cd-ef-gh?tab=history')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-cancelled-type"]').text()).toBe('This visit was cancelled by the visitor.')
            expect($('[data-test="visit-event-1"]').text().trim().replace(/\s+/g, ' ')).toBe('Cancelled')
            expect($('[data-test="visit-actioned-by-1"]').text().trim().replace(/\s+/g, ' ')).toBe('by User Three')
            expect($('[data-test="visit-event-date-time-1"]').text().trim().replace(/\s+/g, ' ')).toBe(
              'Saturday 1 January 2022 at 11am',
            )
            expect($('[data-test="visit-cancelled-reason-1"]').text()).toBe('Reason: no longer required')
          })
      })
    })
  })

  describe('POST /visit/:reference', () => {
    it('should set up sessionData and redirect to select visitors page', () => {
      visit.applicationReference = undefined
      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitSessionData).toEqual(<VisitSessionData>{
            prisoner: {
              name: 'Smith, John',
              offenderNo: 'A1234BC',
              dateOfBirth: '1975-04-02',
              location: '1-1-C-028, HMP Hewell',
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
                address: '123 The Street,<br>Coventry',
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
            visitorSupport: [{ type: 'WHEELCHAIR' }, { text: 'custom request', type: 'OTHER' }],
            mainContact: { contact: visitors[0], phoneNumber: '01234 567890', contactName: 'Jeanette Smith' },
            visitReference: 'ab-cd-ef-gh',
            visitStatus: 'BOOKED',
          })
        })
    })

    it('should redirect to /visit/:reference if selected establishment does not match prison for which visit booked', () => {
      app = appWithAllRoutes({
        services: { auditService, supportedPrisonsService, visitService, visitSessionsService },
        sessionData: {
          selectedEstablishment: { prisonId: 'BLI', prisonName: supportedPrisons.BLI, policyNoticeDaysMin: 2 },
        } as SessionData,
      })

      return request(app).post('/visit/ab-cd-ef-gh').expect(302).expect('location', '/visit/ab-cd-ef-gh')
    })

    // default visit is 13 days away so using 14 days for simplicity
    it('should redirect to /visit/:reference/update/confirm-update if visit is less days away than policy notice days', () => {
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
          selectedEstablishment: { prisonId: 'HEI', prisonName: supportedPrisons.HEI, policyNoticeDaysMin: 14 },
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
          selectedEstablishment: { prisonId: 'HEI', prisonName: supportedPrisons.HEI, policyNoticeDaysMin: 4 },
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
    supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)

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
        expect($('[data-test="go-to-start"]').length).toBe(1)

        expect(clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
