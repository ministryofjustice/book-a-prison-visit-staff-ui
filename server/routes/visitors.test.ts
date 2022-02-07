import type { Express } from 'express'
import request from 'supertest'
import { VisitorListItem } from '../@types/bapv'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import appWithAllRoutes from './testutils/appSetup'

let app: Express
let prisonerVisitorsService: PrisonerVisitorsService
let systemToken

let returnData: { prisonerName: string; visitorList: VisitorListItem[] }

class MockPrisonerVisitorsService extends PrisonerVisitorsService {
  constructor() {
    super(undefined, undefined, undefined)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getVisitors(offenderNo: string, username: string): Promise<{ prisonerName: string; visitorList: VisitorListItem[] }> {
    return Promise.resolve(returnData)
  }
}

beforeEach(() => {
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  prisonerVisitorsService = new MockPrisonerVisitorsService()
  app = appWithAllRoutes(null, null, prisonerVisitorsService, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-visitors/A1234BC', () => {
  it('should render the approved visitor list for offender number A1234BC', () => {
    returnData = {
      prisonerName: 'John Smith',
      visitorList: [
        {
          personId: 4321,
          name: 'Jeanette Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Sister',
          address:
            'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
          restrictions: [
            // @ts-expect-error missing properties from type Restriction
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2022-07-31',
              comment: 'Ban details',
            },
            // @ts-expect-error missing properties from type Restriction
            {
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-01-02',
            },
            // @ts-expect-error missing properties from type Restriction
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-03',
            },
            // @ts-expect-error missing properties from type Restriction
            {
              restrictionType: 'NONCON',
              restrictionTypeDescription: 'Non-Contact Visit',
              startDate: '2022-01-04',
            },
          ],
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: undefined,
          adult: undefined,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
        },
        {
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
        },
      ],
    }

    return request(app)
      .get('/select-visitors/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner name:</strong> John Smith</p>')
        expect(res.text).toContain('id="visitor-4321"')
        expect(res.text).toContain('28 July 1986<br>(Adult)')
        expect(res.text).toContain('Sister')
        expect(res.text).toContain('123 The Street')
        expect(res.text).toContain('visitor-restriction-badge--BAN">Banned</span> until 31 July 2022')
        expect(res.text).toContain('Ban details')
        expect(res.text).toContain('visitor-restriction-badge--RESTRICTED">Restricted</span> End date not entered')
        expect(res.text).toContain('visitor-restriction-badge--CLOSED">Closed</span> End date not entered')
        expect(res.text).toContain('visitor-restriction-badge--NONCON">Non-Contact Visit</span> End date not entered')
        expect(res.text).toMatch(/Bob Smith.|\s*?Not entered.|\s*?Brother.|\s*?1st listed address.|\s*?None/)
        expect(res.text).toMatch(/Anne Smith.|\s*?2 March 2018<br>(Child).|\s*?Not entered.|\s*?None/)
        expect(res.text).toMatch(/<button.|\s*?Continue.|\s*?<\/button>/)
      })
  })

  it('should show message and no Continue button for prisoner with no approved visitors', () => {
    returnData = { prisonerName: 'Adam Jones', visitorList: [] }

    return request(app)
      .get('/select-visitors/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner name:</strong> Adam Jones</p>')
        expect(res.text).toContain('<p>The prisoner has no approved visitors.</p>')
        expect(res.text).not.toMatch(/<button.|\s*?Continue.|\s*?<\/button>/)
      })
  })

  it('should render 400 Bad Request error for invalid prisoner number', () => {
    return request(app)
      .get('/select-visitors/A12--34BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('BadRequestError: Bad Request')
      })
  })
})
