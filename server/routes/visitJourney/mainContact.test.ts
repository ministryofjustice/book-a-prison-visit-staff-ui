import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitorListItem, VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'

let sessionApp: Express

let flashData: FlashData

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`${journey.urlPrefix}/select-main-contact`, () => {
    const adultVisitors: { adults: VisitorListItem[] } = {
      adults: [
        {
          personId: 123,
          name: 'name last',
          adult: true,
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
          adult: true,
          relationshipDescription: 'cousin',
          restrictions: [],
          banned: false,
        },
        {
          personId: 123,
          name: 'name last',
          adult: true,
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
        visitorSupport: [],
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
          adultVisitors,
          visitorList,
          visitSessionData,
        } as SessionData,
      })
    })

    describe(`GET ${journey.urlPrefix}/select-main-contact`, () => {
      it('should render the main contact page with all fields empty', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
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
            adult: true,
            relationshipDescription: 'relate',
            restrictions: [],
            banned: false,
          },
          phoneNumber: '0114 1234 567',
        }

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
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
          .get(`${journey.urlPrefix}/select-main-contact`)
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
          { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
          { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: undefined },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
            expect($('.govuk-error-summary__body').text()).toContain('No main contact selected')
            expect($('.govuk-error-summary__body a').eq(0).attr('href')).toBe('#contact-error')
            expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
            expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#phoneNumber-error')
            expect($('#contact-error').text()).toContain('No main contact selected')
            expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })

      it('should render validation errors from flash data for when no data entered', () => {
        flashData.errors = [
          {
            location: 'body',
            msg: 'Enter the name of the main contact',
            path: 'someoneElseName',
            type: 'field',
            value: '',
          },
          { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: '' },
        ]

        flashData.formValues = [{ contact: 'someoneElse' }]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
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

    describe(`POST ${journey.urlPrefix}/select-main-contact`, () => {
      it('should redirect to request method page and store in session if contact selected and phone number entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send('contact=123')
          .send('phoneNumber=+0114+1234+567+')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contact).toEqual({
              personId: 123,
              name: 'name last',
              adult: true,
              relationshipDescription: 'relate',
              restrictions: [],
              banned: false,
            })
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 1234 567')
            expect(visitSessionData.mainContact.contactName).toBe(undefined)
          })
      })

      it('should redirect to request method page and store in session if other contact named and phone number entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send('contact=someoneElse')
          .send('someoneElseName=++another+person++')
          .send('phoneNumber=0114+7654+321')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contact).toBe(undefined)
            expect(visitSessionData.mainContact.contactName).toBe('another person')
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
          })
      })

      it('should save new choice to session and redirect to request method page if existing session data present', () => {
        visitSessionData.mainContact = {
          contact: {
            personId: 123,
            name: 'name last',
            adult: true,
            relationshipDescription: 'relate',
            restrictions: [],
            banned: false,
          },
          phoneNumber: '0114 1234 567',
          contactName: undefined,
        }
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send('contact=someoneElse')
          .send('someoneElseName=another+person')
          .send('phoneNumber=0114+7654+321')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contact).toBe(undefined)
            expect(visitSessionData.mainContact.contactName).toBe('another person')
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
          })
      })

      it('should set validation errors in flash and redirect if no main contact selected and no number entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-main-contact`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
              { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: '' },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { phoneNumber: '', someoneElseName: '' })
          })
      })

      it('should set validation errors in flash and redirect if someone else selected but no name entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send('contact=someoneElse')
          .send('someoneElseName=')
          .send('phoneNumber=')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-main-contact`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Enter the name of the main contact',
                path: 'someoneElseName',
                type: 'field',
                value: '',
              },
              { location: 'body', msg: 'Enter a phone number', path: 'phoneNumber', type: 'field', value: '' },
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
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send('contact=non-existant')
          .send('phoneNumber=abc123')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-main-contact`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
                path: 'phoneNumber',
                type: 'field',
                value: 'abc123',
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              contact: 'non-existant',
              phoneNumber: 'abc123',
              someoneElseName: '',
            })
          })
      })
    })
  })
})
