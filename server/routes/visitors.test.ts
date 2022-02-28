import type { Express } from 'express'
import request from 'supertest'
import { VisitorListItem } from '../@types/bapv'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import appWithAllRoutes from './testutils/appSetup'

let app: Express
let prisonerVisitorsService: PrisonerVisitorsService
let systemToken

let returnData: { prisonerName: string; visitorList: VisitorListItem[] }
let Cookies: string

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
  app = appWithAllRoutes(null, null, prisonerVisitorsService, null, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/select-visitors/A1234BC', () => {
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
      .get('/visit/select-visitors/A1234BC')
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
        expect(res.text).toContain('<form action="/visit/select-visitors/A1234BC"')
      })
  })

  it('should show message and no Continue button for prisoner with no approved visitors', () => {
    returnData = { prisonerName: 'Adam Jones', visitorList: [] }

    return request(app)
      .get('/visit/select-visitors/A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner name:</strong> Adam Jones</p>')
        expect(res.text).toContain('<p>The prisoner has no approved visitors.</p>')
        expect(res.text).not.toMatch(/<button.|\s*?Continue.|\s*?<\/button>/)
      })
  })

  it('should render 400 Bad Request error for invalid prisoner number', () => {
    return request(app)
      .get('/visit/select-visitors/A12--34BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('BadRequestError: Bad Request')
      })
  })
})

describe('POST /visit/select-visitors/A1234BC', () => {
  beforeEach(done => {
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
          restrictions: [],
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
        },
        {
          personId: 4323,
          name: 'Ted Smith',
          dateOfBirth: '1968-07-28',
          adult: true,
          relationshipDescription: 'Father',
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
        {
          personId: 4325,
          name: 'Bill Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Nephew',
          address: 'Not entered',
          restrictions: [],
        },
      ],
    }

    request(app)
      .get('/visit/select-visitors/A1234BC')
      .end((err, res) => {
        if (err) return done(err)
        Cookies = res.headers['set-cookie'].map((r: string) => r.replace('; path=/; httponly', '')).join('; ')
        return done()
      })
  })

  it('should redirect to the select date and time page if an adult is selected', () => {
    const req = request(app).post('/visit/select-visitors/A1234BC')
    req.cookies = Cookies

    return req.send('visitors=4322').expect(302).expect('location', '/visit/select-date-and-time/A1234BC')
  })

  it('should show an error if no visitors are selected', () => {
    const req = request(app).post('/visit/select-visitors/A1234BC')
    req.cookies = Cookies

    return req.expect('Content-Type', /html/).expect(res => {
      expect(res.text).toContain('No visitors selected')
      expect(res.text).not.toContain('Select no more than 3 visitors with a maximum of 2 adults')
      expect(res.text).not.toContain('Select no more than 2 adults')
      expect(res.text).not.toContain('Add an adult to the visit')
      expect(res.text).toContain('<form action="/visit/select-visitors/A1234BC"')
    })
  })

  it('should show an error if no adults are selected', () => {
    const req = request(app).post('/visit/select-visitors/A1234BC')
    req.cookies = Cookies

    return req
      .send('visitors=4324')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Add an adult to the visit')
        expect(res.text).not.toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('No visitors selected')
      })
  })

  it('should show an error if more than 2 adults are selected', () => {
    const req = request(app).post('/visit/select-visitors/A1234BC')
    req.cookies = Cookies

    return req
      .send('visitors=4321&visitors=4322&visitors=4323')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('No visitors selected')
        expect(res.text).not.toContain('Add an adult to the visit')
      })
  })

  it('should show an error if more than 3 visitors are selected', () => {
    const req = request(app).post('/visit/select-visitors/A1234BC')
    req.cookies = Cookies

    return req
      .send('visitors=4321&visitors=4322&visitors=4323&visitors=4324')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('No visitors selected')
        expect(res.text).not.toContain('Add an adult to the visit')
      })
  })

  describe('GET /visit/select-main-contact/A1234BC', () => {
    it('should show an error if invalid prisoner number supplied', () => {
      const req = request(app).get('/visit/select-main-contact/123')

      return req.expect('Content-Type', /html/).expect(res => {
        expect(res.text).toContain('Invalid prisoner number supplied')
      })
    })
  })
})

describe.only('POST /visit/additional-support/:offenderNo', () => {
  it('should show error if additional support question not answered', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req.expect('Content-Type', /html/).expect(res => {
      expect(res.text).toContain('No answer selected')
    })
  })

  it('should show error if invalid data supplied', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=xyz')
      .send('additionalSupport=ramp')
      .send('additionalSupport=xyz')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No answer selected')
      })
  })

  it('should redirect to the select main contact page if no additional support selected', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req.send('additionalSupportRequired=no').expect(302).expect('location', '/visit/select-main-contact/A1234BC')
  })

  it('should show error if additional support selected but no request selected', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No request selected')
      })
  })

  it('should show error if additional support selected but invalid request selected', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=xyz')
      .send('additionalSupport=ramp')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No request selected')
      })
  })

  it('should redirect to the select main contact page when a single request selected', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=ramp')
      .expect(302)
      .expect('location', '/visit/select-main-contact/A1234BC')
  })

  it('should redirect to the select main contact page when multiple requests selected', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=ramp')
      .send('additionalSupport=inductionLoop')
      .send('additionalSupport=bslInterpreter')
      .send('additionalSupport=faceCoveringExemption')
      .expect(302)
      .expect('location', '/visit/select-main-contact/A1234BC')
  })

  it('should show error if other support requested but not specified', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=other')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter details of the request')
      })
  })

  it('should show error if multiple support requests but other not specified', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=ramp')
      .send('additionalSupport=other')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter details of the request')
      })
  })

  it('should redirect to the select main contact page if additional and other support requests made', () => {
    const req = request(app).post('/visit/additional-support/A1234BC')

    return req
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=ramp')
      .send('additionalSupport=other')
      .send('otherSupportDetails=additional-request-details')
      .expect(302)
      .expect('location', '/visit/select-main-contact/A1234BC')
  })
})
