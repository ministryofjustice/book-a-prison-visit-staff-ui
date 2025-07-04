import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { VisitorSupport } from '../../data/orchestrationApiTypes'

let sessionApp: Express
let flashData: FlashData

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/update-a-visit', isUpdate: true },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
})

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`GET ${journey.urlPrefix}/additional-support`, () => {
    beforeEach(() => {
      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          firstName: 'prisoner',
          lastName: 'name',
          offenderNo: 'A1234BC',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: '1',
          sessionTemplateReference: 'v9d.7ed.7u',
          prisonId: 'HEI',
          startTimestamp: '123',
          endTimestamp: '456',
          availableTables: 1,
          capacity: 30,
          visitRoom: 'room name',
          visitRestriction: 'OPEN',
        },
        visitorIds: [123],
        visitors: [
          {
            personId: 123,
            name: 'name last',
            adult: true,
            relationshipDescription: 'relate',
            restrictions: [],
            banned: false,
          },
        ],
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
        publicBooker: false,
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
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
          expect($('[data-test-app-ref="aaa-bbb-ccc"]').length).toBe(1)
          expect($('[data-test="warning-text"]').text()).toBe(
            'Comments appear on the operational reports that are printed from NOMIS.',
          )
        })
    })

    it('should render the additional support page, pre-populated with session data (for no requests)', () => {
      visitSessionData.visitorSupport = { description: '' }

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

    it('should render the additional support page, pre-populated with session data (for no requests)', () => {
      visitSessionData.publicBooker = true

      return request(sessionApp)
        .get(`${journey.urlPrefix}/additional-support`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
          expect($('[data-test="warning-text"]').text()).toContain(
            'The booker can view this comment on GOV.UK. Comments also appear on the operational reports that are printed from NOMIS.',
          )
        })
    })

    it('should render the additional support page, pre-populated with session data (multiple requests)', () => {
      visitSessionData.visitorSupport = { description: 'Wheelchair, custom request' }

      return request(sessionApp)
        .get(`${journey.urlPrefix}/additional-support`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
          expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
          expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
          expect($('#additionalSupport').val()).toBe('Wheelchair, custom request')
        })
    })

    it('should render validation errors from flash data for no answer selected', () => {
      flashData.errors = [
        {
          msg: 'No answer selected',
          path: 'additionalSupportRequired',
          type: 'field',
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
          expect($('.govuk-error-summary__body a').attr('href')).toBe('#additionalSupportRequired-error')
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
          path: 'additionalSupport',
          type: 'field',
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
          expect($('.govuk-error-summary__body a').attr('href')).toBe('#additionalSupport-error')
          expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
          expect($('#additionalSupport-error').text()).toContain('No request selected')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })
  })

  describe(`POST ${journey.urlPrefix}/additional-support`, () => {
    beforeEach(() => {
      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          firstName: 'prisoner',
          lastName: 'name',
          offenderNo: 'A1234BC',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
        visitSlot: {
          id: '1',
          sessionTemplateReference: 'v9d.7ed.7u',
          prisonId: 'HEI',
          startTimestamp: '123',
          endTimestamp: '456',
          availableTables: 1,
          capacity: 30,
          visitRoom: 'room name',
          visitRestriction: 'OPEN',
        },
        visitorIds: [123],
        visitors: [
          {
            personId: 123,
            name: 'name last',
            adult: true,
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
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    it('should set validation errors in flash and redirect if additional support question not answered', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send({})
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'No answer selected',
              path: 'additionalSupportRequired',
              type: 'field',
              value: undefined,
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { additionalSupport: '' })
        })
    })

    it('should set validation errors in flash and redirect if additional support selected but no request selected', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send({ additionalSupportRequired: 'yes' })
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter details of the request',
              path: 'additionalSupport',
              type: 'field',
              value: '',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            additionalSupportRequired: 'yes',
            additionalSupport: '',
          })
        })
    })

    it('should set validation errors in flash and redirect, overriding values set in session', () => {
      visitSessionData.visitorSupport = { description: '' }

      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send({ additionalSupportRequired: 'yes' })
        .expect(302)
        .expect('location', `${journey.urlPrefix}/additional-support`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter details of the request',
              path: 'additionalSupport',
              type: 'field',
              value: '',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            additionalSupportRequired: 'yes',
            additionalSupport: '',
          })
        })
    })

    it('should clear the session data and redirect to the select main contact page if "no" additional support radio selected and store in session', () => {
      visitSessionData.visitorSupport = { description: 'BSL Required' }
      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send({ additionalSupportRequired: 'no' })
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-main-contact`)
        .expect(() => {
          expect(visitSessionData.visitorSupport.description.length).toBe(0)
        })
    })

    it('should redirect to the select main contact page when support requests chosen and store in session', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/additional-support`)
        .send({
          additionalSupportRequired: 'yes',
          additionalSupport: 'Wheelchair requested',
          otherSupportDetails: 'custom-request',
        })
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-main-contact`)
        .expect(() => {
          expect(visitSessionData.visitorSupport).toEqual(<VisitorSupport>{ description: 'Wheelchair requested' })
        })
    })
  })
})
