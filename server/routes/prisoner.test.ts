import type { Express } from 'express'
import request from 'supertest'
import { PrisonerProfile, BAPVVisitBalances } from '../@types/bapv'
import { InmateDetail } from '../data/prisonApiTypes'
import PrisonerProfileService from '../services/prisonerProfileService'
import appWithAllRoutes from './testutils/appSetup'

let app: Express
let prisonerProfileService: PrisonerProfileService
let systemToken

let returnData: PrisonerProfile

class MockPrisonerProfileService extends PrisonerProfileService {
  constructor() {
    super(undefined, undefined, undefined)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProfile(offenderNo: string, username: string): Promise<PrisonerProfile> {
    return Promise.resolve(returnData)
  }
}

beforeEach(() => {
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  prisonerProfileService = new MockPrisonerProfileService()
  app = appWithAllRoutes(null, prisonerProfileService, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/A1234BC', () => {
  it('should render the prisoner profile page for offender number A1234BC', () => {
    returnData = {
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
    }

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">Smith, John</h1>')
        expect(res.text).toContain('class="flagged-alerts-list"')
        expect(res.text).toContain('class="govuk-tag flagged-alert flagged-alert--UPIU"')
        expect(res.text).toContain('Protective Isolation Unit')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toMatch(/<strong>Conviction status<\/strong>\s+Convicted/)
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
        expect(res.text).toMatch(/<a.*?class="govuk-button".*?>\s+Book a prison visit\s+<\/a>/)
      })
  })
  it('should render the prisoner profile page for offender number A1234BC without active alerts if there are none', () => {
    returnData = {
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
    }

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
    returnData = {
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
    }

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">James, Fred</h1>')
        expect(res.text).not.toContain('class="flagged-alerts-list"')
        expect(res.text).toContain('B2345CD')
        expect(res.text).toMatch(/<strong>Conviction status<\/strong>\s+Remand/)
        expect(res.text).not.toMatch(/id="visiting-orders"/)
        expect(res.text).not.toContain('Visiting orders')
        expect(res.text).toContain('2 active')
      })
  })

  it('should render 400 Bad Request error for invalid prisoner number', () => {
    return request(app)
      .get('/prisoner/A12--34BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('BadRequestError: Bad Request')
      })
  })
})
