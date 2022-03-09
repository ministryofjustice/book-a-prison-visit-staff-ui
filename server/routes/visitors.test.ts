import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitorListItem, VisitSessionData } from '../@types/bapv'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'

let app: Express
let sessionApp: Express
let prisonerVisitorsService: PrisonerVisitorsService
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let returnData: { prisonerName: string; visitorList: VisitorListItem[] }
let visitSessionData: VisitSessionData

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
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/select-visitors', () => {
  beforeAll(() => {
    prisonerVisitorsService = new MockPrisonerVisitorsService()
    sessionApp = appWithAllRoutes(null, null, prisonerVisitorsService, null, systemToken, false, {
      visitSessionData: {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
      },
    } as SessionData)
  })

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

    return request(sessionApp)
      .get('/visit/select-visitors')
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
        expect(res.text).toContain('<form action="/visit/select-visitors"')
      })
  })

  it('should show message and no Continue button for prisoner with no approved visitors', () => {
    returnData = { prisonerName: 'Adam Jones', visitorList: [] }

    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner name:</strong> Adam Jones</p>')
        expect(res.text).toContain('<p>The prisoner has no approved visitors.</p>')
        expect(res.text).not.toMatch(/<button.|\s*?Continue.|\s*?<\/button>/)
      })
  })

  it.skip('should render 400 Bad Request error for invalid prisoner number', () => {
    return request(app)
      .get('/visit/select-visitors')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('BadRequestError: Bad Request')
      })
  })
})

describe('POST /visit/select-visitors', () => {
  beforeAll(() => {
    const visitorList: VisitorListItem[] = [
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
    ]
    prisonerVisitorsService = new MockPrisonerVisitorsService()
    sessionApp = appWithAllRoutes(null, null, prisonerVisitorsService, null, systemToken, false, {
      visitorList,
      visitSessionData: {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
      },
    } as SessionData)
  })

  it('should redirect to the select date and time page if an adult is selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4322')
      .expect(302)
      .expect('location', '/visit/select-date-and-time')
  })

  it('should show an error if no visitors are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No visitors selected')
        expect(res.text).not.toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('Add an adult to the visit')
        expect(res.text).toContain('<form action="/visit/select-visitors"')
      })
  })

  it('should show an error if no visitors are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No visitors selected')
        expect(res.text).not.toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('Add an adult to the visit')
        expect(res.text).toContain('<form action="/visit/select-visitors"')
      })
  })

  it('should show an error if no adults are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
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
    return request(sessionApp)
      .post('/visit/select-visitors')
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
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4321&visitors=4322&visitors=4323&visitors=4324')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select no more than 3 visitors with a maximum of 2 adults')
        expect(res.text).not.toContain('Select no more than 2 adults')
        expect(res.text).not.toContain('No visitors selected')
        expect(res.text).not.toContain('Add an adult to the visit')
      })
  })
})

describe('GET /visit/additional-support/:offenderNo', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [
            {
              restrictionType: 'AVS',
              restrictionTypeDescription: 'AVS desc',
              startDate: '123',
              expiryDate: '456',
              globalRestriction: false,
              comment: 'comment',
            },
          ],
        },
      ],
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
  })

  it('should render the additional support page with no options selected', () => {
    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toContain('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
      })
  })

  it('should render the additional support page, pre-populated with session data (for no requests)', () => {
    visitSessionData.additionalSupport = { required: false }

    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toContain('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(true)
      })
  })

  it('should render the additional support page, pre-populated with session data (multiple requests)', () => {
    visitSessionData.additionalSupport = {
      required: true,
      keys: ['wheelchair', 'maskExempt', 'other'],
      other: 'custom request',
    }

    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toContain('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
        expect($('[data-test="wheelchair"]').prop('checked')).toBe(true)
        expect($('[data-test="inductionLoop"]').prop('checked')).toBe(false)
        expect($('[data-test="bslInterpreter"]').prop('checked')).toBe(false)
        expect($('[data-test="maskExempt"]').prop('checked')).toBe(true)
        expect($('[data-test="other"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails').val()).toContain('custom request')
      })
  })

  it('should render validation errors from flash data for no answer selected', () => {
    flashData.errors = [
      {
        msg: 'No answer selected',
        param: 'additionalSupportRequired',
        location: 'body',
      },
    ]

    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
        expect($('#additionalSupportRequired-error').text()).toContain('No answer selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should render validation errors from flash data for support requested but none selected', () => {
    flashData.errors = [
      {
        value: [],
        msg: 'No request selected',
        param: 'additionalSupport',
        location: 'body',
      },
    ]

    flashData.formValues = [{ additionalSupportRequired: 'yes' }]

    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-error-summary__body').text()).toContain('No request selected')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('#additionalSupport-error').text()).toContain('No request selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should render validation errors from flash data when other support details not provided', () => {
    flashData.errors = [
      {
        value: '',
        msg: 'Enter details of the request',
        param: 'otherSupportDetails',
        location: 'body',
      },
    ]

    flashData.formValues = [{ additionalSupportRequired: 'yes', additionalSupport: ['wheelchair', 'other'] }]

    return request(sessionApp)
      .get('/visit/additional-support/A1234BC')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-error-summary__body').text()).toContain('Enter details of the request')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="wheelchair"]').prop('checked')).toBe(true)
        expect($('[data-test="other"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails-error').text()).toContain('Enter details of the request')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /visit/additional-support/:offenderNo', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [
            {
              restrictionType: 'AVS',
              restrictionTypeDescription: 'AVS desc',
              startDate: '123',
              expiryDate: '456',
              globalRestriction: false,
              comment: 'comment',
            },
          ],
        },
      ],
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
  })

  it('should set validation errors in flash and redirect if additional support question not answered', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'additionalSupportRequired', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if invalid data supplied', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=xyz')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'additionalSupportRequired', value: 'xyz' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'xyz',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if additional support selected but no request selected', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: [] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if additional support selected but invalid request selected', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=xyz')
      .send('additionalSupport=wheelchair')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: ['xyz', 'wheelchair'] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['xyz', 'wheelchair'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if other support requested but not specified', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=other')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Enter details of the request', param: 'otherSupportDetails', value: '' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['other'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect, overriding values set in session', () => {
    visitSessionData.additionalSupport = {
      required: false,
    }

    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/visit/additional-support/A1234BC')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: [] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should redirect to the select main contact page if "no" additional support radio selected and store in session', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=no')
      .expect(302)
      .expect('location', '/visit/select-main-contact/A1234BC')
      .expect(() => {
        expect(visitSessionData.additionalSupport?.required).toBe(false)
      })
  })

  it('should redirect to the select main contact page when support requests chosen and store in session', () => {
    return request(sessionApp)
      .post('/visit/additional-support/A1234BC')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=wheelchair')
      .send('additionalSupport=inductionLoop')
      .send('additionalSupport=bslInterpreter')
      .send('additionalSupport=maskExempt')
      .send('additionalSupport=other')
      .send('otherSupportDetails=custom-request')
      .expect(302)
      .expect('location', '/visit/select-main-contact/A1234BC')
      .expect(() => {
        expect(visitSessionData.additionalSupport?.required).toBe(true)
        expect(visitSessionData.additionalSupport?.keys).toEqual([
          'wheelchair',
          'inductionLoop',
          'bslInterpreter',
          'maskExempt',
          'other',
        ])
        expect(visitSessionData.additionalSupport?.other).toBe('custom-request')
      })
  })
})

describe.skip('GET /visit/select-main-contact/A1234BC', () => {
  it('should show an error if invalid prisoner number supplied', () => {
    const req = request(app).get('/visit/select-main-contact/123')

    return req.expect('Content-Type', /html/).expect(res => {
      expect(res.text).toContain('Invalid prisoner number supplied')
    })
  })
})
