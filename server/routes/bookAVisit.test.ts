import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitorListItem, VisitSessionData } from '../@types/bapv'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { SupportType, Visit, VisitorSupport } from '../data/visitSchedulerApiTypes'
import * as visitorUtils from './visitorUtils'
import config from '../config'
import NotificationsService from '../services/notificationsService'

jest.mock('../services/prisonerProfileService')
jest.mock('../services/prisonerVisitorsService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
const auditService = new AuditService() as jest.Mocked<AuditService>

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

const availableSupportTypes: SupportType[] = [
  {
    type: 'WHEELCHAIR',
    description: 'Wheelchair ramp',
  },
  {
    type: 'INDUCTION_LOOP',
    description: 'Portable induction loop for people with hearing aids',
  },
  {
    type: 'BSL_INTERPRETER',
    description: 'British Sign Language (BSL) Interpreter',
  },
  {
    type: 'MASK_EXEMPT',
    description: 'Face covering exemption',
  },
  {
    type: 'OTHER',
    description: 'Other',
  },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /book-a-visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
      ],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  it('should render the additional support page with no options selected', () => {
    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
      })
  })

  it('should render the additional support page, pre-populated with session data (for no requests)', () => {
    visitSessionData.visitorSupport = []

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(true)
      })
  })

  it('should render the additional support page, pre-populated with session data (multiple requests)', () => {
    visitSessionData.visitorSupport = [
      { type: 'WHEELCHAIR' },
      { type: 'MASK_EXEMPT' },
      { type: 'OTHER', text: 'custom request' },
    ]

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
        expect($('[data-test="WHEELCHAIR"]').prop('checked')).toBe(true)
        expect($('[data-test="INDUCTION_LOOP"]').prop('checked')).toBe(false)
        expect($('[data-test="BSL_INTERPRETER"]').prop('checked')).toBe(false)
        expect($('[data-test="MASK_EXEMPT"]').prop('checked')).toBe(true)
        expect($('[data-test="OTHER"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails').val()).toBe('custom request')
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
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
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
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
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

    flashData.formValues = [{ additionalSupportRequired: 'yes', additionalSupport: ['WHEELCHAIR', 'OTHER'] }]

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('.govuk-error-summary__body').text()).toContain('Enter details of the request')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="WHEELCHAIR"]').prop('checked')).toBe(true)
        expect($('[data-test="OTHER"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails-error').text()).toContain('Enter details of the request')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /book-a-visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
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
          banned: false,
        },
      ],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  it('should set validation errors in flash and redirect if additional support question not answered', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=xyz')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=xyz')
      .send('additionalSupport=WHEELCHAIR')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: ['xyz', 'WHEELCHAIR'] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['xyz', 'WHEELCHAIR'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if other support requested but not specified', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=OTHER')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Enter details of the request', param: 'otherSupportDetails', value: '' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['OTHER'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect, overriding values set in session', () => {
    visitSessionData.visitorSupport = []

    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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

  it('should clear the session data and redirect to the select main contact page if "no" additional support radio selected and store in session', () => {
    visitSessionData.visitorSupport = [{ type: 'BSL_INTERPRETER' }]
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=no')
      .expect(302)
      .expect('location', '/book-a-visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.visitorSupport.length).toBe(0)
      })
  })

  it('should redirect to the select main contact page when support requests chosen and store in session', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=WHEELCHAIR')
      .send('additionalSupport=INDUCTION_LOOP')
      .send('additionalSupport=BSL_INTERPRETER')
      .send('additionalSupport=MASK_EXEMPT')
      .send('additionalSupport=OTHER')
      .send('otherSupportDetails=custom-request')
      .expect(302)
      .expect('location', '/book-a-visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.visitorSupport).toEqual(<VisitorSupport[]>[
          { type: 'WHEELCHAIR' },
          { type: 'INDUCTION_LOOP' },
          { type: 'BSL_INTERPRETER' },
          { type: 'MASK_EXEMPT' },
          {
            type: 'OTHER',
            text: 'custom-request',
          },
        ])
      })
  })
})

describe('/book-a-visit/select-main-contact', () => {
  const adultVisitors: { adults: VisitorListItem[] } = {
    adults: [
      {
        personId: 123,
        name: 'name last',
        relationshipDescription: 'relate',
        restrictions: [],
        banned: false,
      },
    ],
  }

  const visitorList: { visitors: VisitorListItem[] } = {
    visitors: [
      {
        personId: 122,
        name: 'first last',
        relationshipDescription: 'cousin',
        restrictions: [],
        banned: false,
      },
      {
        personId: 123,
        name: 'name last',
        relationshipDescription: 'relate',
        restrictions: [],
        banned: false,
      },
    ],
  }

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
      ],
      visitorSupport: [],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        adultVisitors,
        visitorList,
        visitSessionData,
      } as SessionData,
    })
  })

  describe('GET /book-a-visit/select-main-contact', () => {
    it('should render the main contact page with all fields empty', () => {
      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(0)
          expect($('input[name="contact"]').eq(0).prop('value')).toBe('123')
          expect($('input[name="contact"]').eq(1).prop('value')).toBe('someoneElse')
          expect($('#someoneElseName').prop('value')).toBeFalsy()
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should render the main contact page, pre-populated with session data for contact choice and phone number', () => {
      visitSessionData.mainContact = {
        contact: {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
        phoneNumber: '0114 1234 567',
      }

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(1)
          expect($('input[value="123"]').prop('checked')).toBe(true)
          expect($('#someoneElseName').prop('value')).toBeFalsy()
          expect($('#phoneNumber').prop('value')).toBe('0114 1234 567')
        })
    })

    it('should render the main contact page, pre-populated with session data for custom contact name and phone number', () => {
      visitSessionData.mainContact = {
        contact: undefined,
        contactName: 'another person',
        phoneNumber: '0114 1122 333',
      }

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(1)
          expect($('input[value="someoneElse"]').prop('checked')).toBe(true)
          expect($('#someoneElseName').prop('value')).toBe('another person')
          expect($('#phoneNumber').prop('value')).toBe('0114 1122 333')
        })
    })

    it('should render validation errors from flash data for when no data entered', () => {
      flashData.errors = [
        { location: 'body', msg: 'No main contact selected', param: 'contact', value: undefined },
        { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: undefined },
      ]

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('.govuk-error-summary__body').text()).toContain('No main contact selected')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
          expect($('#contact-error').text()).toContain('No main contact selected')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })

    it('should render validation errors from flash data for when no data entered', () => {
      flashData.errors = [
        { location: 'body', msg: 'Enter the name of the main contact', param: 'someoneElseName', value: '' },
        { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: '' },
      ]

      flashData.formValues = [{ contact: 'someoneElse' }]

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('.govuk-error-summary__body').text()).toContain('Enter the name of the main contact')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
          expect($('#someoneElseName-error').text()).toContain('Enter the name of the main contact')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })
  })

  describe('POST /book-a-visit/select-main-contact', () => {
    it('should redirect to check answers page and store in session if contact selected and phone number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=123')
        .send('phoneNumber=0114+1234+567')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toEqual({
            personId: 123,
            name: 'name last',
            relationshipDescription: 'relate',
            restrictions: [],
            banned: false,
          })
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 1234 567')
          expect(visitSessionData.mainContact.contactName).toBe(undefined)
        })
    })

    it('should redirect to check answers page and store in session if other contact named and phone number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=another+person')
        .send('phoneNumber=0114+7654+321')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toBe(undefined)
          expect(visitSessionData.mainContact.contactName).toBe('another person')
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
        })
    })

    it('should save new choice to session and redirect to check answers page if existing session data present', () => {
      visitSessionData.mainContact = {
        contact: {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
        phoneNumber: '0114 1234 567',
        contactName: undefined,
      }
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=another+person')
        .send('phoneNumber=0114+7654+321')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toBe(undefined)
          expect(visitSessionData.mainContact.contactName).toBe('another person')
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
        })
    })

    it('should set validation errors in flash and redirect if no main contact selected and no number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No main contact selected', param: 'contact', value: undefined },
            { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should set validation errors in flash and redirect if someone else selected but no name entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=')
        .send('phoneNumber=')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Enter the name of the main contact', param: 'someoneElseName', value: '' },
            { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: '' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            contact: 'someoneElse',
            someoneElseName: '',
            phoneNumber: '',
          })
        })
    })

    it('should set validation errors in flash and redirect if invalid data entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=non-existant')
        .send('phoneNumber=abc123')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
              param: 'phoneNumber',
              value: 'abc123',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            contact: 'non-existant',
            phoneNumber: 'abc123',
          })
        })
    })
  })
})

describe('/book-a-visit/check-your-booking', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '2022-03-12T09:30:00',
        endTimestamp: '2022-03-12T10:30:00',
        availableTables: 1,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
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
          address: '123 Street,<br>Test Town,<br>S1 2QZ',
          banned: false,
        },
      ],
      visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'INDUCTION_LOOP' }],
      mainContact: {
        phoneNumber: '0123 456 7890',
        contactName: 'abc',
      },
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  describe('GET /book-a-visit/check-your-booking', () => {
    it('should render all data from the session', () => {
      return request(sessionApp)
        .get('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('Wheelchair ramp')
          expect($('.test-additional-support').text()).toContain('Portable induction loop for people with hearing aids')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')
        })
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      visitSessionData.visitorSupport = []

      return request(sessionApp)
        .get('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('None')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')
        })
    })
  })

  describe('POST /book-a-visit/check-your-booking', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken,
    ) as jest.Mocked<VisitSessionsService>

    const notificationsService = new NotificationsService(null) as jest.Mocked<NotificationsService>

    beforeEach(() => {
      const bookedVisit: Partial<Visit> = { reference: visitSessionData.visitReference, visitStatus: 'BOOKED' }

      visitSessionsService.updateVisit = jest.fn().mockResolvedValue(bookedVisit)
      notificationsService.sendBookingSms = jest.fn().mockResolvedValue({})

      sessionApp = appWithAllRoutes({
        auditServiceOverride: auditService,
        notificationsServiceOverride: notificationsService,
        visitSessionsServiceOverride: visitSessionsService,
        systemTokenOverride: systemToken,
        sessionData: {
          availableSupportTypes,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should book visit, record audit event, send SMS (notifications enabled) and redirect to confirmation page', () => {
      config.apis.notifications.enabled = true

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.bookedVisit).toHaveBeenCalledWith(
            visitSessionData.visitReference,
            visitSessionData.prisoner.offenderNo,
            'HEI',
            [visitSessionData.visitors[0].personId.toString()],
            '2022-03-12T09:30:00',
            '2022-03-12T10:30:00',
            'OPEN',
            undefined,
            undefined,
          )
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledWith({
            phoneNumber: '01234567890',
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
        })
    })

    it('should handle SMS sending failure', () => {
      config.apis.notifications.enabled = true

      notificationsService.sendBookingSms.mockRejectedValue({})

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
        })
    })

    it('should NOT send SMS if notifications disabled', () => {
      config.apis.notifications.enabled = false

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(302)
        .expect('location', '/book-a-visit/confirmation')
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
        })
    })

    it('should handle booking failure, display error message and NOT record audit event nor send SMS', () => {
      config.apis.notifications.enabled = true

      visitSessionsService.updateVisit.mockRejectedValue({})

      return request(sessionApp)
        .post('/book-a-visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.govuk-error-summary__body').text()).toContain('Failed to make this reservation')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('form').prop('action')).toBe('/book-a-visit/check-your-booking')

          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitStatus).toBe('RESERVED')
          expect(auditService.bookedVisit).not.toHaveBeenCalled()
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
        })
    })
  })
})

describe('GET /book-a-visit/confirmation', () => {
  beforeEach(() => {
    jest.spyOn(visitorUtils, 'clearSession')

    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '2022-03-12T09:30:00',
        endTimestamp: '2022-03-12T10:30:00',
        availableTables: 1,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
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
          address: '123 Street,<br>Test Town,<br>S1 2QZ',
          banned: false,
        },
      ],
      visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'INDUCTION_LOOP' }],
      mainContact: {
        phoneNumber: '123',
        contactName: 'abc',
      },
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'BOOKED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  it('should render all data from the session', () => {
    return request(sessionApp)
      .get('/book-a-visit/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Booking confirmed')
        expect($('.test-prisoner-name').text()).toContain('prisoner name')
        expect($('.test-prisoner-location').text()).toContain('location place')
        expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
        expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
        expect($('.test-visit-type').text()).toContain('Open')
        expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
        expect($('.test-additional-support1').text()).toContain('Wheelchair ramp')
        expect($('.test-additional-support2').text()).toContain('Portable induction loop for people with hearing aids')
        expect($('.test-main-contact-name').text()).toContain('abc')
        expect($('.test-main-contact-number').text()).toContain('123')
        expect($('.test-booking-reference').text()).toContain('ab-cd-ef-gh')

        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })

  describe('when no additional support options are chosen', () => {
    beforeEach(() => {
      jest.spyOn(visitorUtils, 'clearSession')

      visitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visit: {
          id: 'visitId',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
          availableTables: 1,
          visitRoomName: 'room name',
          visitRestriction: 'OPEN',
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
            address: '123 Street,<br>Test Town,<br>S1 2QZ',
            banned: false,
          },
        ],
        visitorSupport: [],
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }

      sessionApp = appWithAllRoutes({
        systemTokenOverride: systemToken,
        sessionData: {
          availableSupportTypes,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      return request(sessionApp)
        .get('/book-a-visit/confirmation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Booking confirmed')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-prisoner-location').text()).toContain('location place')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('[data-test="no-addition-support-chosen"]').text()).toContain('None.')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('123')
          expect($('.test-booking-reference').text()).toContain('ab-cd-ef-gh')

          expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
        })
    })
  })
})
