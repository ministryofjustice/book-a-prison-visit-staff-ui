import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { PrisonerProfilePage, VisitInformation, VisitSessionData, FlashData } from '../@types/bapv'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { clearSession } from './visitorUtils'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerProfileService,
  createMockPrisonerSearchService,
  createMockVisitSessionsService,
} from '../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerProfileService = createMockPrisonerProfileService()
const prisonerSearchService = createMockPrisonerSearchService()
const visitSessionsService = createMockVisitSessionsService()

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
    services: { auditService, prisonerProfileService, prisonerSearchService, visitSessionsService },
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/A1234BC', () => {
  let prisonerProfile: PrisonerProfilePage

  beforeEach(() => {
    prisonerProfile = {
      activeAlerts: [
        [
          {
            text: 'Security',
          },
          {
            text: 'Protective Isolation Unit',
          },
          {
            text: 'Professional lock pick',
          },
          {
            html: '1 January 2022',
          },
          {
            html: '2 January 2022',
          },
        ],
      ],
      activeAlertCount: 1,
      flaggedAlerts: [
        {
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
        },
      ],
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
        },
      },
      contactNames: {},
    }

    prisonerProfileService.getProfile.mockResolvedValue(prisonerProfile)
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

        expect($('[data-test="tab-vo-remaining"]').text()).toBe('1')
        expect($('[data-test="tab-vo-last-date"]').text()).toBe('21 April 2021')
        // expect($('[data-test="tab-vo-next-date"]').text()).toBe('15 May 2021')
        expect($('[data-test="tab-pvo-remaining"]').text()).toBe('0')
        expect($('[data-test="tab-pvo-last-date"]').text()).toBe('1 December 2021')
        // expect($('[data-test="tab-pvo-next-date"]').text()).toBe('1 January 2022')
        expect($('.govuk-back-link').attr('href')).toBe('/search/prisoner')

        expect($('#active-alerts').text()).toContain('Professional lock pick')

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
      })
  })

  it('should render the prisoner profile page for offender number A1234BC without active alerts if there are none', () => {
    prisonerProfile.flaggedAlerts = []
    prisonerProfile.activeAlerts = []
    prisonerProfile.activeAlertCount = 0

    return request(app)
      .get('/prisoner/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Smith, John')
        expect($('.flagged-alerts-list').length).toBe(0)
        expect($('[data-test="active-alert-count"]').text()).toBe('0 active')
        expect($('#active-alerts').text()).toContain('There are no active alerts for this prisoner.')
        expect(auditService.viewPrisoner).toHaveBeenCalledTimes(1)
        expect(auditService.viewPrisoner).toHaveBeenCalledWith({
          prisonerId: 'A1234BC',
          prisonId,
          username: 'user1',
          operationId: undefined,
        })
      })
  })
  // Skipped as currently not got logic incorportated to skip requesting VO's for remand
  it.skip('should render prisoner profile page without visiting orders for REMAND', () => {
    prisonerProfile.prisonerDetails.convictedStatus = 'Remand'
    prisonerProfile.prisonerDetails.visitBalances = undefined

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
        param: 'vo-override',
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
  let prisonerProfile: PrisonerProfilePage
  beforeEach(() => {
    prisonerProfile = {
      activeAlerts: [
        [
          {
            text: 'Security',
          },
          {
            text: 'Protective Isolation Unit',
          },
          {
            text: 'Professional lock pick',
          },
          {
            html: '1 January 2022',
          },
          {
            html: '2 January 2022',
          },
        ],
      ],
      activeAlertCount: 1,
      flaggedAlerts: [
        {
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
        },
      ],
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
        },
      },
      contactNames: {},
    }

    prisonerProfileService.getProfile.mockResolvedValue(prisonerProfile)
  })

  it('should set up visitSessionData and redirect to select visitors page', () => {
    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
        expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '2 April 1975',
            location: '1-1-C-028, Hewell (HMP)',
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
        expect(auditService.overrodeZeroVO).toHaveBeenCalledTimes(1)
        expect(auditService.overrodeZeroVO).toHaveBeenCalledWith({
          prisonerId: 'A1234BC',
          username: 'user1',
          operationId: undefined,
        })
        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '2 April 1975',
            location: '1-1-C-028, Hewell (HMP)',
          },
        })
      })
  })

  it('should replace existing visitSessionData and redirect to select visitors page', () => {
    visitSessionData.prisoner = {
      name: 'Someone, Else',
      offenderNo: 'C4321BA',
      dateOfBirth: '5 May 1980',
      location: 'a cell, HMP Prison',
    }

    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getProfile).toHaveBeenCalledWith(prisonId, 'A1234BC', 'user1')
        expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '2 April 1975',
            location: '1-1-C-028, Hewell (HMP)',
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
        expect(auditService.overrodeZeroVO).not.toHaveBeenCalled()
        expect(visitSessionData).toEqual({})
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select the box to book a prison visit',
            param: 'vo-override',
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

describe('GET /prisoner/A1234BC/visits', () => {
  const prisoner = TestData.prisoner()

  it('should list upcoming visits for the prisoner with back link to new search if no search in querystring', () => {
    const visitInfo: VisitInformation[] = [
      {
        reference: 'ab-cd-ef-gh',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'John Smith',
        visitDate: '14 February 2022',
        visitTime: '10am to 11:15am',
        visitStatus: 'BOOKED',
      },
      {
        reference: 'gm-in-az-ma',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'Fred Smith',
        visitDate: '24 February 2022',
        visitTime: '2pm to 3pm',
        visitStatus: 'CANCELLED',
      },
    ]

    prisonerSearchService.getPrisoner.mockResolvedValue(prisoner)
    visitSessionsService.getUpcomingVisits.mockResolvedValue(visitInfo)

    return request(app)
      .get('/prisoner/A1234BC/visits')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Smith, John')
        expect($('.govuk-back-link').attr('href')).toBe('/search/prisoner-visit')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')
        expect($('[data-test="visit-mainContact-1"]').text()).toBe('Smith, John')
        expect($('[data-test="visit-date-1"]').text()).toBe('14 February 2022')
        expect($('[data-test="visit-status-1"]').text()).toBe('Booked')

        expect($('[data-test="visit-reference-2"]').text()).toBe('gm-in-az-ma')
        expect($('[data-test="visit-mainContact-2"]').text()).toBe('Smith, Fred')
        expect($('[data-test="visit-date-2"]').text()).toBe('24 February 2022')
        expect($('[data-test="visit-status-2"]').text()).toBe('Cancelled')
      })
  })
  it('should list upcoming visits for the prisoner with back link to results if search in querystring', () => {
    const visitInfo: VisitInformation[] = [
      {
        reference: 'ab-cd-ef-gh',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'John Smith',
        visitDate: '14 February 2022',
        visitTime: '10am to 11:15am',
        visitStatus: 'BOOKED',
      },
      {
        reference: 'gm-in-az-ma',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'Fred Smith',
        visitDate: '24 February 2022',
        visitTime: '2pm to 3pm',
        visitStatus: 'CANCELLED',
      },
    ]

    prisonerSearchService.getPrisoner.mockResolvedValue(prisoner)
    visitSessionsService.getUpcomingVisits.mockResolvedValue(visitInfo)

    return request(app)
      .get('/prisoner/A1234BC/visits?search=A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Smith, John')
        expect($('.govuk-back-link').attr('href')).toBe('/search/prisoner-visit/results?search=A1234BC')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')
        expect($('[data-test="visit-mainContact-1"]').text()).toBe('Smith, John')
        expect($('[data-test="visit-date-1"]').text()).toBe('14 February 2022')
        expect($('[data-test="visit-status-1"]').text()).toBe('Booked')

        expect($('[data-test="visit-reference-2"]').text()).toBe('gm-in-az-ma')
        expect($('[data-test="visit-mainContact-2"]').text()).toBe('Smith, Fred')
        expect($('[data-test="visit-date-2"]').text()).toBe('24 February 2022')
        expect($('[data-test="visit-status-2"]').text()).toBe('Cancelled')
      })
  })

  it('should show message and back-to-start button if prisoner has no upcoming visits', () => {
    prisonerSearchService.getPrisoner.mockResolvedValue(prisoner)
    visitSessionsService.getUpcomingVisits.mockResolvedValue([])

    return request(app)
      .get('/prisoner/A1234BC/visits')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('main').text()).toContain('There are no upcoming visits for this prisoner.')
        expect($('[data-test="go-to-start"]').length).toBe(1)
      })
  })

  it('should render 400 Bad Request error for invalid prisoner number', () => {
    return request(app)
      .get('/prisoner/A12--34BC/visits')
      .expect(400)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('BadRequestError: Bad Request')
      })
  })

  it('should render 404 Not Found error if prisoner not found', () => {
    prisonerSearchService.getPrisoner.mockResolvedValue(null)

    return request(app)
      .get('/prisoner/A1234BC/visits')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
      })
  })
})
