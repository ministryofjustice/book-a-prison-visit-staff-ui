import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { SupportType, VisitorSupport } from '../../data/visitSchedulerApiTypes'
import config from '../../config'

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [{ urlPrefix: '/book-a-visit' }, { urlPrefix: '/visit/ab-cd-ef-gh/update' }]

config.features.updateJourneyEnabled = true

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

testJourneys.forEach(journey => {
  describe(`GET ${journey.urlPrefix}/additional-support`, () => {
    beforeEach(() => {
      visitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: 'visitId',
          startTimestamp: '123',
          endTimestamp: '456',
          availableTables: 1,
          capacity: 30,
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
        .get(`${journey.urlPrefix}/additional-support`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
          expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-date-and-time`)
          expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
          expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
        })
    })

    it('should render the additional support page, pre-populated with session data (for no requests)', () => {
      visitSessionData.visitorSupport = []

      return request(sessionApp)
        .get(`${journey.urlPrefix}/additional-support`)
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
        .get(`${journey.urlPrefix}/additional-support`)
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
        .get(`${journey.urlPrefix}/additional-support`)
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
        .get(`${journey.urlPrefix}/additional-support`)
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
        .get(`${journey.urlPrefix}/additional-support`)
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

  describe(`POST ${journey.urlPrefix}/additional-support`, () => {
    beforeEach(() => {
      visitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: 'visitId',
          startTimestamp: '123',
          endTimestamp: '456',
          availableTables: 1,
          capacity: 30,
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
        .post(`${journey.urlPrefix}/additional-support`)
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=xyz')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=yes')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=yes')
        .send('additionalSupport=xyz')
        .send('additionalSupport=WHEELCHAIR')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=yes')
        .send('additionalSupport=OTHER')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=yes')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
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
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=no')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-main-contact`)
        .expect(() => {
          expect(visitSessionData.visitorSupport.length).toBe(0)
        })
    })

    it('should redirect to the select main contact page when support requests chosen and store in session', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send('additionalSupportRequired=yes')
        .send('additionalSupport=WHEELCHAIR')
        .send('additionalSupport=INDUCTION_LOOP')
        .send('additionalSupport=BSL_INTERPRETER')
        .send('additionalSupport=MASK_EXEMPT')
        .send('additionalSupport=OTHER')
        .send('otherSupportDetails=custom-request')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-main-contact`)
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
})
