import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { PrisonerProfile, BAPVVisitBalances, VisitInformation, VisitSessionData } from '../@types/bapv'
import { InmateDetail } from '../data/prisonApiTypes'
import PrisonerProfileService from '../services/prisonerProfileService'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { appWithAllRoutes } from './testutils/appSetup'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

jest.mock('../services/prisonerProfileService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
let visitSessionData: Partial<VisitSessionData>

const prisonerProfileService = new PrisonerProfileService(
  null,
  null,
  null,
  systemToken
) as jest.Mocked<PrisonerProfileService>
const prisonerSearchService = new PrisonerSearchService(null, systemToken) as jest.Mocked<PrisonerSearchService>
const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken
) as jest.Mocked<VisitSessionsService>

beforeEach(() => {
  visitSessionData = {}

  app = appWithAllRoutes(
    prisonerSearchService,
    prisonerProfileService,
    null,
    visitSessionsService,
    systemToken,
    false,
    {
      visitSessionData,
    } as SessionData
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/A1234BC', () => {
  it('should render the prisoner profile page for offender number A1234BC', () => {
    const returnData: PrisonerProfile = {
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
            text: 'Professional lock pick.',
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
      } as InmateDetail,
      convictedStatus: 'Convicted',
      visitBalances: {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '21 April 2021',
        latestPrivIepAdjustDate: '1 December 2021',
        nextIepAdjustDate: '15 May 2021',
        nextPrivIepAdjustDate: '1 January 2022',
      } as BAPVVisitBalances,
      upcomingVisits: [],
      pastVisits: [],
    }

    prisonerProfileService.getProfile.mockResolvedValue(returnData)

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">Smith, John</h1>')
        expect(res.text).toContain('class="flagged-alerts-list"')
        expect(res.text).toContain('class="govuk-tag flagged-alert flagged-alert--UPIU"')
        expect(res.text).toContain('Protective Isolation Unit')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toMatch(/<strong>Conviction status<\/strong>\s+<span data-test="convicted-status">Convicted/)
        expect(res.text).toMatch(/id="visiting-orders"/)
        expect(res.text).toMatch(/id="active-alerts"/)
        expect(res.text).toContain('Professional lock pick.')
        expect(res.text).toContain('Remaining VOs: 1')
        expect(res.text).toContain('Remaining PVOs: 2')
        expect(res.text).toContain('21 April 2021')
        expect(res.text).toContain('1 December 2021')
        expect(res.text).toContain('15 May 2021')
        expect(res.text).toContain('1 January 2022')
        expect(res.text).toContain('1 active')
        expect(res.text).toMatch(/<button.*?class="govuk-button".*?>\s+Book a prison visit\s+<\/button>/)
      })
  })

  it('should render the prisoner profile page for offender number A1234BC without active alerts if there are none', () => {
    const returnData: PrisonerProfile = {
      displayName: 'Smith, John',
      displayDob: '12 October 1980',
      activeAlerts: [],
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
        activeAlertCount: 0,
        inactiveAlertCount: 3,
        legalStatus: 'SENTENCED',
      } as InmateDetail,
      convictedStatus: 'Convicted',
      visitBalances: {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '21 April 2021',
        latestPrivIepAdjustDate: '1 December 2021',
        nextIepAdjustDate: '15 May 2021',
        nextPrivIepAdjustDate: '1 January 2022',
      } as BAPVVisitBalances,
      upcomingVisits: [],
      pastVisits: [],
    }

    prisonerProfileService.getProfile.mockResolvedValue(returnData)

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">Smith, John</h1>')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toContain('There are no active alerts for this prisoner.')
        expect(res.text).toMatch(/id="active-alerts"/)
        expect(res.text).toContain('0 active')
      })
  })

  it('should render prisoner profile page without visiting orders for REMAND', () => {
    const returnData: PrisonerProfile = {
      displayName: 'James, Fred',
      displayDob: '11 December 1985',
      activeAlerts: [],
      flaggedAlerts: [],
      inmateDetail: {
        offenderNo: 'B2345CD',
        firstName: 'FRED',
        lastName: 'JAMES',
        dateOfBirth: '1985-12-11',
        activeAlertCount: 2,
        inactiveAlertCount: 4,
        legalStatus: 'REMAND',
      } as InmateDetail,
      convictedStatus: 'Remand',
      visitBalances: null,
      upcomingVisits: [],
      pastVisits: [],
    }

    prisonerProfileService.getProfile.mockResolvedValue(returnData)

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">James, Fred</h1>')
        expect(res.text).not.toContain('class="flagged-alerts-list"')
        expect(res.text).toContain('B2345CD')
        expect(res.text).toMatch(/<strong>Conviction status<\/strong>\s+<span data-test="convicted-status">Remand/)
        expect(res.text).not.toMatch(/id="visiting-orders"/)
        expect(res.text).not.toContain('Visiting orders')
        expect(res.text).toContain('2 active')
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
  const prisoner: Prisoner = {
    firstName: 'JOHN',
    lastName: 'SMITH',
    prisonerNumber: 'A1234BC',
    dateOfBirth: '1975-04-02',
    prisonName: 'HMP Hewell',
    cellLocation: '1-1-C-028',
    restrictedPatient: false,
  }

  it('should set up visitSessionData and redirect to select visitors page', () => {
    prisonerSearchService.getPrisoner.mockResolvedValue(prisoner)

    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerSearchService.getPrisoner).toHaveBeenCalledTimes(1)
        expect(prisonerSearchService.getPrisoner).toHaveBeenCalledWith('A1234BC', undefined)
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '2 April 1975',
            location: '1-1-C-028, HMP Hewell',
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

    prisonerSearchService.getPrisoner.mockResolvedValue(prisoner)

    return request(app)
      .post('/prisoner/A1234BC')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(res => {
        expect(prisonerSearchService.getPrisoner).toHaveBeenCalledTimes(1)
        expect(prisonerSearchService.getPrisoner).toHaveBeenCalledWith('A1234BC', undefined)
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '2 April 1975',
            location: '1-1-C-028, HMP Hewell',
          },
        })
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
  const prisoner: Prisoner = {
    prisonerNumber: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    restrictedPatient: false,
  }
  it('should list upcoming visits for the prisoner', () => {
    const visitInfo: VisitInformation[] = [
      {
        reference: 'ab-cd-ef-gh',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'John Smith',
        visitDate: '14 February 2022',
        visitTime: '10am to 11:15am',
      },
      {
        reference: 'gm-in-az-ma',
        prisonNumber: 'A1234BC',
        prisonerName: '',
        mainContact: 'Fred Smith',
        visitDate: '24 February 2022',
        visitTime: '2pm to 3pm',
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
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')
        expect($('[data-test="visit-mainContact-1"]').text()).toBe('Smith, John')
        expect($('[data-test="visit-date-1"]').text()).toBe('14 February 2022')
        expect($('[data-test="visit-time-1"]').text()).toBe('10am to 11:15am')

        expect($('[data-test="visit-reference-2"]').text()).toBe('gm-in-az-ma')
        expect($('[data-test="visit-mainContact-2"]').text()).toBe('Smith, Fred')
        expect($('[data-test="visit-date-2"]').text()).toBe('24 February 2022')
        expect($('[data-test="visit-time-2"]').text()).toBe('2pm to 3pm')
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
