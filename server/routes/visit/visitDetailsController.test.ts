import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { NotificationType, Visit, VisitHistoryDetails } from '../../data/orchestrationApiTypes'
import { VisitorListItem, VisitSessionData } from '../../@types/bapv'
import TestData from '../testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerSearchService,
  createMockSupportedPrisonsService,
  createMockVisitService,
} from '../../services/testutils/mocks'
import { notificationTypeWarnings } from '../../constants/notificationEvents'
import { MojTimelineItem } from '../../services/visitService'

let app: Express

const auditService = createMockAuditService()
const prisonerSearchService = createMockPrisonerSearchService()
const supportedPrisonsService = createMockSupportedPrisonsService()
const visitService = createMockVisitService()

let visitSessionData: VisitSessionData

const prison = TestData.prison()
const supportedPrisonIds = TestData.supportedPrisonIds()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit details page', () => {
  const childBirthYear = new Date().getFullYear() - 5

  const prisoner = TestData.prisoner()

  let visit: Visit
  let visitHistoryDetails: VisitHistoryDetails

  const visitEventsTimeline: MojTimelineItem[] = [
    {
      label: { text: 'Needs review' },
      text: `Reason: Time slot removed`,
      datetime: { timestamp: '2022-01-01T11:00:00', type: 'datetime' },
      byline: null,
      attributes: { 'data-test': 'timeline-entry-0' },
    },
    {
      label: { text: 'Updated' },
      text: `Method: Email request`,
      datetime: { timestamp: '2022-01-01T10:00:00', type: 'datetime' },
      byline: { text: 'User Two' },
      attributes: { 'data-test': 'timeline-entry-1' },
    },
    {
      label: { text: 'Booked' },
      text: `Method: Phone booking`,
      datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
      byline: { text: 'User One' },
      attributes: { 'data-test': 'timeline-entry-2' },
    },
  ]

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
          comment: 'closed comment text',
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
    visitService.getVisitEventsTimeline.mockReturnValue(visitEventsTimeline)
    supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
    supportedPrisonsService.getPrison.mockResolvedValue(prison)

    visitSessionData = { allowOverBooking: false, prisoner: undefined }

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerSearchService,
        supportedPrisonsService,
        visitService,
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
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC')
          // visit details
          expect($('[data-test="visit-date"]').text()).toContain('Friday 14 January 2022')
          expect($('[data-test="visit-time"]').text()).toContain('10am to 11am')
          expect($('[data-test="visit-room"]').text()).toContain('Visit room 1')
          expect($('[data-test="visit-type"]').text()).toBe('Open visit')
          expect($('[data-test="visit-contact"]').text()).toBe('Jeanette Smith')
          expect($('[data-test="visit-phone"]').text()).toBe('01234 567890')
          expect($('[data-test="visit-email"]').text()).toBe('visitor@example.com')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="additional-support"]').text()).toContain(
            'Wheelchair ramp, Portable induction loop for people with hearing aids',
          )
          // actions
          expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
          expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, HMP Hewell')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-age"]').text()).toBe('46 years old')
          // visitor details
          expect($('[data-test="visitor-name-1"]').text()).toBe('Jeanette Smith')
          expect($('[data-test="visitor-relation-1"]').text()).toBe('sister')
          expect($('[data-test="visitor-dob-1"]').text()).toBe('28 July 1986')
          expect($('[data-test="visitor-age-1"]').text()).toBe('35 years old')
          expect($('[data-test="visitor-address-1"]').text()).toBe('123 The Street,\nCoventry')
          expect($('[data-test="visitor-1-restriction-1"]').text()).toContain('Closed')
          expect($('[data-test="visitor-1-restriction-text-1"]').text()).toContain('closed comment text')

          // booking history
          // first event
          expect($('[data-test="timeline-entry-0"] .moj-timeline__title').text()).toBe('Needs review')
          expect($('[data-test="timeline-entry-0"] .moj-timeline__byline').text().trim().replace(/\s+/g, ' ')).toBe('')
          expect($('[data-test="timeline-entry-0"] time').text()).toBe('Saturday 1 January 2022 at 11am')
          expect($('[data-test="timeline-entry-0"] .moj-timeline__description').text()).toBe(
            'Reason: Time slot removed',
          )
          // second event
          expect($('[data-test="timeline-entry-1"] .moj-timeline__title').text()).toBe('Updated')
          expect($('[data-test="timeline-entry-1"] .moj-timeline__byline').text().trim().replace(/\s+/g, ' ')).toBe(
            'by User Two',
          )
          expect($('[data-test="timeline-entry-1"] time').text()).toBe('Saturday 1 January 2022 at 10am')
          expect($('[data-test="timeline-entry-1"] .moj-timeline__description').text()).toBe('Method: Email request')
          // third event
          expect($('[data-test="timeline-entry-2"] .moj-timeline__title').text()).toBe('Booked')
          expect($('[data-test="timeline-entry-2"] .moj-timeline__byline').text().trim().replace(/\s+/g, ' ')).toBe(
            'by User One',
          )
          expect($('[data-test="timeline-entry-2"] time').text()).toBe('Saturday 1 January 2022 at 9am')
          expect($('[data-test="timeline-entry-2"] .moj-timeline__description').text()).toBe('Method: Phone booking')

          expect(visitSessionData).toEqual({ allowOverBooking: false, prisoner: undefined })

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

    it('should render full booking summary page and show no contact details message', () => {
      visit.visitContact.telephone = undefined
      visit.visitContact.email = undefined

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-phone"]').length).toBe(0)
          expect($('[data-test="visit-email"]').length).toBe(0)
          expect($('[data-test="visit-no-contact-details"]').text()).toBe('No contact details provided')
        })
    })

    describe('back links', () => {
      beforeEach(() => {
        prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications,
          additionalSupport,
        })
      })

      it('should render booking summary page with correct back link when coming from upcoming visits listing page', () => {
        const url =
          '/visit/ab-cd-ef-gh?from=visit-search&query=searchBlock1%3Dab%26searchBlock2%3Dcd%26searchBlock3%3Def%26searchBlock4%3Dgh'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe(
              '/search/visit/results?searchBlock1=ab&searchBlock2=cd&searchBlock3=ef&searchBlock4=gh',
            )
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })

      it('should render booking summary page with correct back link when coming from view visits by date page', () => {
        const url =
          '/visit/ab-cd-ef-gh?query=type%3DOPEN%26sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-01%26firstTabDate%3D2024-02-01&from=visits'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe(
              '/visits?type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
            )
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })

      it('should render booking summary page with correct back link when coming from review listing page', () => {
        const url = '/visit/ab-cd-ef-gh?from=review'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe('/review')
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
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
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-age"]').text()).toBe('46 years old')
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
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-age"]').text()).toBe('46 years old')
          expect($('[data-test="prisoner-location"]').text()).toBe(releasedPrisoner.locationDescription)
        })
    })

    it('should not show booking summary if selected establishment does not match prison for which visit booked', () => {
      const otherPrison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, activeCaseLoadId: otherPrison.prisonId }),
        services: { auditService, prisonerSearchService, supportedPrisonsService, visitService },
        sessionData: {
          selectedEstablishment: otherPrison,
        } as SessionData,
      })

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')

          expect(res.text).toContain(`This booking is not for ${otherPrison.prisonName}`)
          expect(res.text).toContain(`change the establishment to ${prison.prisonName}`)

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

    describe('Visit notification messages and actions', () => {
      it('should not display visit notification banner or do not change button when no notification types set', () => {
        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-notification"]').length).toBe(0)
            expect($('[data-test="clear-notifications"]').length).toBe(0)
          })
      })

      it('should display a single visit notification banner and NOT the do not change button when only a blocked date notification set', () => {
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications: ['PRISON_VISITS_BLOCKED_FOR_DATE'],
          additionalSupport,
        })

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visit-notification"]').length).toBe(1)
            expect($('[data-test="visit-notification"]').text()).toBe(
              notificationTypeWarnings.PRISON_VISITS_BLOCKED_FOR_DATE,
            )
            expect($('[data-test="clear-notifications"]').length).toBe(0)
          })
      })

      it('should display a single visit notification banner and do not change button when a single notification type is set', () => {
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
            expect($('[data-test="clear-notifications"]').length).toBe(1)
            expect($('[data-test="clear-notifications"]').text()).toContain('Do not change')
          })
      })

      it('should display two visit notification banners and do not change button when two notification types are set', () => {
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
            expect($('[data-test="clear-notifications"]').length).toBe(1)
            expect($('[data-test="clear-notifications"]').text()).toContain('Do not change')
          })
      })

      it('should not show the Update button if the visit has a prisoner released notification', () => {
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
            expect($('[data-test="update-visit"]').length).toBeFalsy()
          })
      })

      it('should not show the Update button if the visit has a prisoner transferred notification', () => {
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications: ['PRISONER_RECEIVED_EVENT', 'PRISON_VISITS_BLOCKED_FOR_DATE'],
          additionalSupport,
        })

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="update-visit"]').length).toBeFalsy()
          })
      })

      it('should show the Update button if the visit has other notifications', () => {
        visitService.getFullVisitDetails.mockResolvedValue({
          visitHistoryDetails,
          visitors,
          notifications: ['PRISON_VISITS_BLOCKED_FOR_DATE'],
          additionalSupport,
        })

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="update-visit"]').length).toBeTruthy()
          })
      })
    })
  })
})
