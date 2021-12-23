import type { Express } from 'express'
import request from 'supertest'
import { PrisonerProfile } from '../@types/bapv'
import { InmateDetail } from '../data/prisonApiTypes'
import PrisonerProfileService from '../services/prisonerProfileService'
import appWithAllRoutes from './testutils/appSetup'

let app: Express
let prisonerProfileService: PrisonerProfileService
let systemToken

let returnData: PrisonerProfile

class MockPrisonerProfileService extends PrisonerProfileService {
  constructor() {
    super(undefined, undefined)
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
  it('should render the prisoner profile page for offender no A1234BC', () => {
    returnData = {
      displayName: 'Smith, John',
      displayDob: '12 October 1980',
      inmateDetail: {
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1980-10-12',
        activeAlertCount: 1,
        inactiveAlertCount: 3,
        legalStatus: 'SENTENCED',
      } as InmateDetail,
      visitBalances: {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      },
    }

    return request(app)
      .get('/prisoner/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<h1 class="govuk-heading-l">Smith, John</h1>')
        expect(res.text).toContain('A1234BC')
        expect(res.text).toContain('Remaining VOs: 1')
        expect(res.text).toContain('Remaining PVOs: 2')
        expect(res.text).toContain('1 active, 3 inactive')
        expect(res.text).toMatch(/<a.*?class="govuk-button".*?>\s+Book a prison visit\s+<\/a>/)
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
