import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { PrisonerProfilePage, VisitSessionData, FlashData } from '../@types/bapv'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { clearSession } from './visitorUtils'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerProfileService,
  createMockVisitService,
} from '../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerProfileService = createMockPrisonerProfileService()
const visitService = createMockVisitService()

const prisonId = 'HEI'

let visitSessionData: Partial<VisitSessionData>

jest.mock('./visitorUtils', () => ({
  clearSession: jest.fn((req: Express.Request) => {
    req.session.visitSessionData = visitSessionData as VisitSessionData
  }),
}))

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })

  visitSessionData = {}

  app = appWithAllRoutes({
    services: { auditService, prisonerProfileService, visitService },
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/prisoner/:offenderNo - Prisoner profile', () => {
  let prisonerProfile: PrisonerProfilePage

  const restriction = TestData.offenderRestriction()
  const alert = TestData.alert({
    alertType: 'X',
    alertTypeDescription: 'Security',
    alertCode: 'XR',
    alertCodeDescription: 'Racist',
    startDate: '2022-01-01',
    expiryDate: '2022-01-02',
  })

  beforeEach(() => {
    prisonerProfile = {
      alerts: [alert],
      flaggedAlerts: [TestData.alert({ alertCode: 'UPIU', alertCodeDescription: 'Protective Isolation Unit' })],
      visitsByMonth: new Map(),
      prisonerDetails: {
        prisonerId: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
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
  })

  describe('GET /prisoner/A1234BC', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('should render the prisoner profile page for offender number A1234BC with back link to search page with empty querystring', () => {
      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__body').length).toBe(0)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('.flagged-alerts-list .flagged-alert.flagged-alert--UPIU').text().trim()).toBe(
            'Protective Isolation Unit',
          )
          expect($('[data-test="prison-number"]').text()).toBe('A1234BC')
          expect($('[data-test="dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
          expect($('[data-test="category"]').text()).toBe('Cat C')
          expect($('[data-test="iep-level"]').text()).toBe('Standard')
          expect($('[data-test="convicted-status"]').text()).toBe('Convicted')
          expect($('[data-test="active-alert-count"]').text()).toBe('1 active')
          expect($('[data-test="remaining-vos"]').text()).toBe('1')
          expect($('[data-test="remaining-pvos"]').text()).toBe('0')

          expect($('#visiting-orders').length).toBe(1)
          expect($('[data-test="tab-vo-remaining"]').text()).toBe('1')
          expect($('[data-test="tab-vo-last-date"]').text()).toBe('21 April 2021')
          expect($('[data-test="tab-vo-next-date"]').text()).toBe('5 May 2021')
          expect($('[data-test="tab-pvo-remaining"]').text()).toBe('0')
          expect($('[data-test="tab-pvo-last-date"]').text()).toBe('1 December 2021')
          expect($('[data-test="tab-pvo-next-date"]').text()).toBe('1 January 2022')
          expect($('.govuk-back-link').attr('href')).toBe('/search/prisoner')
          expect($('[data-test="all-alerts-link"]').attr('href')).toBe(
            'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC/alerts/active',
          )

          expect($('#active-alerts').text()).toContain('Racist')

          expect($('#vo-override').length).toBe(0)
          expect($('[data-test="book-a-visit"]').length).toBe(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should show back link to search results page with querystring', () => {
      return request(app)
        .get('/prisoner/A1234BC?search=A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__body').length).toBe(0)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('.govuk-back-link').attr('href')).toBe('/search/prisoner/results?search=A1234BC')
          expect($('[data-test="book-a-visit"]').length).toBe(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should group upcoming and past visits by month in the Visits tab', () => {
      const fakeDateTime = '2023-03-01T09:00'
      jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

      const visitors = [
        { nomisPersonId: 4321, firstName: 'Jeanette', lastName: 'Smith' },
        { nomisPersonId: 4322, firstName: 'Bob', lastName: 'Smith' },
      ]
      const upcomingVisit = TestData.visitSummary({
        startTimestamp: '2023-03-02T10:00',
        endTimestamp: '2023-03-02T11:00',
        visitors,
      })
      const pastVisit = TestData.visitSummary({
        startTimestamp: '2023-02-03T10:00',
        endTimestamp: '2023-02-03T11:00',
        visitors,
      })
      const cancelledVisit = TestData.visitSummary({
        startTimestamp: '2023-02-03T10:00',
        endTimestamp: '2023-02-03T11:00',
        visitStatus: 'CANCELLED',
        visitors,
      })

      prisonerProfile.visitsByMonth = new Map([
        ['March 2023', { upcomingCount: 1, pastCount: 0, visits: [upcomingVisit] }],
        ['February 2023', { upcomingCount: 0, pastCount: 1, visits: [pastVisit, cancelledVisit] }],
        ['January 2023', { upcomingCount: 0, pastCount: 0, visits: [cancelledVisit] }],
      ])

      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('.prisoner-profile-visits:nth-child(1) caption').text()).toBe('March 2023 (1 upcoming visit)')
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-reference"]').length).toBe(1)
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-reference"]').eq(0).text()).toBe(
            upcomingVisit.reference,
          )
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-type"] > span').eq(0).html()).toBe(
            'Social<br>(Open)',
          )
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-location"]').eq(0).text()).toBe(
            'Hewell (HMP)',
          )
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-date-and-time"]').eq(0).html()).toBe(
            'Thursday 2 March 2023<br>10am - 11am',
          )
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-visitors"]').eq(0).html()).toBe(
            'Jeanette Smith<br>Bob Smith',
          )
          expect($('.prisoner-profile-visits:nth-child(1) [data-test="tab-visits-status"]').eq(0).text()).toBe('Booked')

          expect($('.prisoner-profile-visits:nth-child(2) caption').text()).toBe('February 2023 (1 past visit)')
          expect($('.prisoner-profile-visits:nth-child(2) [data-test="tab-visits-reference"]').length).toBe(2)

          expect($('.prisoner-profile-visits:nth-child(3) caption').text()).toBe('January 2023')
          expect($('.prisoner-profile-visits:nth-child(3) [data-test="tab-visits-reference"]').length).toBe(1)

          expect($('[data-test="view-dps-profile"]').text().trim()).toBe('View full visits history')
          expect($('[data-test="view-dps-profile"]').attr('href')).toBe(
            'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC/visits-details',
          )
        })
    })

    it('should display message in the Visits tab when there are no upcoming or past visits', () => {
      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('#visits').text()).toContain(
            'There are no upcoming visits or visits within the last 3 months for this prisoner.',
          )
          expect($('[data-test="view-dps-profile"]').text().trim()).toBe('View full visits history')
        })
    })

    it('should render the prisoner profile page for offender number A1234BC without active alerts if there are none', () => {
      prisonerProfile.flaggedAlerts = []
      prisonerProfile.alerts = []

      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('.flagged-alerts-list').length).toBe(0)
          expect($('[data-test="active-alert-count"]').text()).toBe('0 active')
          expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render prisoner profile page without visiting orders for REMAND', () => {
      prisonerProfile.prisonerDetails.convictedStatus = 'Remand'
      prisonerProfile.prisonerDetails.visitBalances = null

      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('[data-test="convicted-status"]').text()).toBe('Remand')
          expect($('[data-test="remaining-vos"]').length).toBe(0)
          expect($('[data-test="remaining-pvos"]').length).toBe(0)
          expect($('#visiting-orders').length).toBe(0)
        })
    })

    it('should render prisoner profile page with VO Override checkbox if VO balances zero', () => {
      prisonerProfile.prisonerDetails.visitBalances.remainingVo = 0

      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('[data-test="remaining-vos"]').text()).toBe('0')
          expect($('[data-test="remaining-pvos"]').text()).toBe('0')
          expect($('#vo-override').length).toBe(1)
          expect($('label[for="vo-override"]').text()).toContain('The prisoner has no available visiting orders')
          expect($('[data-test="book-a-visit"]').length).toBe(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render prisoner profile page with VO Override validation errors', () => {
      prisonerProfile.prisonerDetails.visitBalances.remainingVo = 0

      flashData.errors = [
        {
          msg: 'Select the box to book a prison visit',
          path: 'vo-override',
          type: 'field',
          location: 'body',
        },
      ]

      return request(app)
        .get('/prisoner/A1234BC')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__body').text()).toContain('Select the box to book a prison visit')
          expect($('.govuk-error-summary__body a').attr('href')).toBe('#vo-override-error')
          expect($('h1').text().trim()).toBe('Smith, John')
          expect($('[data-test="remaining-vos"]').text()).toBe('0')
          expect($('[data-test="remaining-pvos"]').text()).toBe('0')
          expect($('#vo-override').length).toBe(1)
          expect($('#vo-override-error').text()).toContain('Select the box to book a prison visit')
          expect($('label[for="vo-override"]').text()).toContain('The prisoner has no available visiting orders')
          expect($('[data-test="book-a-visit"]').length).toBe(1)
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
          expect(auditService.viewPrisoner).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            prisonId,
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render 400 Bad Request error for invalid prisoner number', () => {
      return request(app)
        .get('/prisoner/A12--34BC')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })
  })

  describe('POST /prisoner/A1234BC', () => {
    it('should set up visitSessionData and redirect to select visitors page', () => {
      prisonerProfileService.getRestrictions.mockResolvedValue([restriction])
      return request(app)
        .post('/prisoner/A1234BC')
        .expect(302)
        .expect('location', '/book-a-visit/select-visitors')
        .expect(res => {
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitSessionData).toStrictEqual(<VisitSessionData>{
            prisoner: {
              firstName: 'John',
              lastName: 'Smith',
              offenderNo: 'A1234BC',
              location: '1-1-C-028, Hewell (HMP)',
              alerts: [alert],
              restrictions: [restriction],
            },
          })
        })
    })

    it('should set up visitSessionData, redirect to select visitors page and log VO override to audit', () => {
      prisonerProfile.prisonerDetails.visitBalances.remainingVo = 0

      return request(app)
        .post('/prisoner/A1234BC')
        .send('vo-override=override')
        .expect(302)
        .expect('location', '/book-a-visit/select-visitors')
        .expect(res => {
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(auditService.overrodeZeroVO).toHaveBeenCalledTimes(1)
          expect(auditService.overrodeZeroVO).toHaveBeenCalledWith({
            prisonerId: 'A1234BC',
            username: 'user1',
            operationId: undefined,
          })
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitSessionData).toEqual(<VisitSessionData>{
            prisoner: {
              firstName: 'John',
              lastName: 'Smith',
              offenderNo: 'A1234BC',
              location: '1-1-C-028, Hewell (HMP)',
              alerts: [
                TestData.alert({
                  alertType: 'X',
                  alertTypeDescription: 'Security',
                  alertCode: 'XR',
                  alertCodeDescription: 'Racist',
                  startDate: '2022-01-01',
                  expiryDate: '2022-01-02',
                }),
              ],
            },
          })
        })
    })

    it('should replace existing visitSessionData and redirect to select visitors page', () => {
      visitSessionData.prisoner = {
        firstName: 'other',
        lastName: 'prisoner',
        offenderNo: 'C4321BA',
        location: 'a cell, HMP Prison',
      }

      return request(app)
        .post('/prisoner/A1234BC')
        .expect(302)
        .expect('location', '/book-a-visit/select-visitors')
        .expect(res => {
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
          expect(visitSessionData).toEqual(<VisitSessionData>{
            prisoner: {
              firstName: 'John',
              lastName: 'Smith',
              offenderNo: 'A1234BC',
              location: '1-1-C-028, Hewell (HMP)',
              alerts: [
                TestData.alert({
                  alertType: 'X',
                  alertTypeDescription: 'Security',
                  alertCode: 'XR',
                  alertCodeDescription: 'Racist',
                  startDate: '2022-01-01',
                  expiryDate: '2022-01-02',
                }),
              ],
            },
          })
        })
    })

    it('should set error in flash and redirect back to profile page if VO balances zero', () => {
      prisonerProfile.prisonerDetails.visitBalances.remainingVo = 0

      return request(app)
        .post('/prisoner/A1234BC')
        .expect(302)
        .expect('location', '/prisoner/A1234BC')
        .expect(res => {
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
          expect(visitSessionData).toEqual({})
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Select the box to book a prison visit',
              path: 'vo-override',
              type: 'field',
              value: undefined,
            },
          ])
        })
    })

    it('should render 400 Bad Request error for invalid prisoner number', () => {
      return request(app)
        .post('/prisoner/A12--34BC')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })
  })
})
