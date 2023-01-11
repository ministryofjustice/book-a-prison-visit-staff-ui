import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { PrisonerProfile, BAPVVisitBalances, VisitInformation, VisitSessionData } from '../@types/bapv'
import { InmateDetail, VisitBalances } from '../data/prisonApiTypes'
import PrisonerProfileService from '../services/prisonerProfileService'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { clearSession } from './visitorUtils'
import { createPrisoner } from '../data/__testutils/testObjects'

jest.mock('../services/prisonerProfileService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')

let app: Express
const prisonId = 'HEI'
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
let flashData: Record<string, string[] | Record<string, string>[]>
let visitSessionData: Partial<VisitSessionData>

const prisonerProfileService = new PrisonerProfileService(
  null,
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<PrisonerProfileService>
const prisonerSearchService = new PrisonerSearchService(null, systemToken) as jest.Mocked<PrisonerSearchService>
const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<VisitSessionsService>
const auditService = new AuditService() as jest.Mocked<AuditService>

jest.mock('./visitorUtils', () => ({
  clearSession: jest.fn((req: Express.Request) => {
    req.session.visitSessionData = visitSessionData as VisitSessionData
  }),
}))

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })

  visitSessionData = {}

  app = appWithAllRoutes({
    prisonerSearchServiceOverride: prisonerSearchService,
    prisonerProfileServiceOverride: prisonerProfileService,
    visitSessionsServiceOverride: visitSessionsService,
    auditServiceOverride: auditService,
    systemTokenOverride: systemToken,
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/A1234BC', () => {
  let prisonerProfile: PrisonerProfile

  beforeEach(() => {
    prisonerProfile = {
      displayName: 'Smith, John',
      displayDob: '12 October 1980',
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
      flaggedAlerts: [
        {
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
        },
      ],
      inmateDetail: {
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1980-10-12',
        activeAlertCount: 1,
        inactiveAlertCount: 3,
        legalStatus: 'SENTENCED',
        assignedLivingUnit: {
          description: '1-1-C-028',
          agencyName: 'Hewell (HMP)',
        },
        category: 'Cat C',
        privilegeSummary: {
          iepLevel: 'Standard',
        },
      } as InmateDetail,
      convictedStatus: 'Convicted',
      visitBalances: {
        remainingVo: 1,
        remainingPvo: 0,
        latestIepAdjustDate: '21 April 2021',
        latestPrivIepAdjustDate: '1 December 2021',
        nextIepAdjustDate: '15 May 2021',
        nextPrivIepAdjustDate: '1 January 2022',
      } as BAPVVisitBalances,
      upcomingVisits: [],
      pastVisits: [],
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
        expect($('[data-test="dob"]').text()).toBe('12 October 1980')
        expect($('[data-test="location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
        expect($('[data-test="category"]').text()).toBe('Cat C')
        expect($('[data-test="iep-level"]').text()).toBe('Standard')
        expect($('[data-test="convicted-status"]').text()).toBe('Convicted')
        expect($('[data-test="active-alert-count"]').text()).toBe('1 active')
        expect($('[data-test="remaining-vos"]').text()).toBe('1')
        expect($('[data-test="remaining-pvos"]').text()).toBe('0')

        expect($('[data-test="tab-vo-remaining"]').text()).toBe('1')
        expect($('[data-test="tab-vo-last-date"]').text()).toBe('21 April 2021')
        expect($('[data-test="tab-vo-next-date"]').text()).toBe('15 May 2021')
        expect($('[data-test="tab-pvo-remaining"]').text()).toBe('0')
        expect($('[data-test="tab-pvo-last-date"]').text()).toBe('1 December 2021')
        expect($('[data-test="tab-pvo-next-date"]').text()).toBe('1 January 2022')
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

  it('should render the prisoner profile page for offender number A1234BC without active alerts if there are none', () => {
    prisonerProfile.flaggedAlerts = []
    prisonerProfile.activeAlerts = []
    prisonerProfile.inmateDetail.activeAlertCount = 0

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

  it('should render prisoner profile page without visiting orders for REMAND', () => {
    prisonerProfile.convictedStatus = 'Remand'
    prisonerProfile.visitBalances = undefined

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
    prisonerProfile.visitBalances.remainingVo = 0

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
    prisonerProfile.visitBalances.remainingVo = 0

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
  const inmateDetail = {
    offenderNo: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    dateOfBirth: '1975-04-02',
    activeAlertCount: 0,
    inactiveAlertCount: 3,
    legalStatus: 'SENTENCED',
    assignedLivingUnit: {
      description: '1-1-C-028',
      agencyName: 'Hewell (HMP)',
    },
  } as InmateDetail

  const visitBalances = {} as VisitBalances

  beforeEach(() => {
    visitBalances.remainingVo = 1
    visitBalances.remainingPvo = 0

    prisonerProfileService.getPrisonerAndVisitBalances.mockResolvedValue({ inmateDetail, visitBalances })
  })

  it('should set up visitSessionData and redirect to select visitors page', () => {
    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledWith('A1234BC', prisonId, 'user1')
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
    visitBalances.remainingVo = 0

    return request(app)
      .post('/prisoner/A1234BC')
      .send('vo-override=override')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledWith('A1234BC', prisonId, 'user1')
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
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledWith('A1234BC', prisonId, 'user1')
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
    visitBalances.remainingVo = 0

    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/prisoner/A1234BC')
      .expect(res => {
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledTimes(1)
        expect(prisonerProfileService.getPrisonerAndVisitBalances).toHaveBeenCalledWith('A1234BC', prisonId, 'user1')
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
  const prisoner = createPrisoner()

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
