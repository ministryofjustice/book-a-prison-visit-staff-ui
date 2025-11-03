import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitorListItem, VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import { createMockVisitService } from '../../services/testutils/mocks'
import { ApplicationDto } from '../../data/orchestrationApiTypes'
import TestData from '../testutils/testData'

let sessionApp: Express
let flashData: FlashData

let visitSessionData: VisitSessionData
let selectedEstablishment: SessionData['selectedEstablishment']

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
        allowOverBooking: false,
        prisoner: {
          firstName: 'prisoner',
          lastName: 'name',
          offenderNo: 'A1234BC',
          location: 'location place',
        },
        prisonId: 'HEI',
        selectedVisitSession: {
          date: 'date',
          sessionTemplateReference: 'v9d.7ed.7u',
          startTime: '123',
          endTime: '456',
          availableTables: 1,
          capacity: 30,
        },
        visitRestriction: 'OPEN',
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
        visitorSupport: { description: '' },
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
      }

      selectedEstablishment = { ...TestData.prison(), isEnabledForPublic: true }

      sessionApp = appWithAllRoutes({
        sessionData: {
          adultVisitors,
          visitorList,
          visitSessionData,
          selectedEstablishment,
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
            expect($('#phoneNumberInput').prop('value')).toBeFalsy()
            expect($('#emAddr').prop('value')).toBeFalsy()
          })
      })

      it('should render the main contact page, pre-populated with session data for contact choice, phone number and email', () => {
        visitSessionData.mainContact = {
          contactId: 123,
          phoneNumber: '0114 1234 567',
          email: 'test@example.com',
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
            expect($('#phoneNumberInput').prop('value')).toBe('0114 1234 567')
            expect($('#emAddr').prop('value')).toBe('test@example.com')
          })
      })

      it('should render the main contact page, pre-populated with session data for custom contact name, phone number and email', () => {
        visitSessionData.mainContact = {
          contactId: undefined,
          contactName: 'another person',
          phoneNumber: '0114 1122 333',
          email: 'test@example.com',
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
            expect($('#phoneNumberInput').prop('value')).toBe('0114 1122 333')
            expect($('#emAddr').prop('value')).toBe('test@example.com')
          })
      })

      it('should render the main contact page, without the email field, if prison not enabled for public', () => {
        selectedEstablishment.isEnabledForPublic = false
        visitSessionData.mainContact = {
          contactId: undefined,
          contactName: 'another person',
          phoneNumber: '0114 1122 333',
          email: 'test@example.com',
        }

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
            expect($('#emAddr').length).toBe(0)
          })
      })

      it('should render validation errors from flash data for when no data or invalid email entered', () => {
        flashData.errors = [
          { location: 'body', msg: 'No main contact selected', path: 'contact', type: 'field', value: undefined },
          { location: 'body', msg: 'Enter a phone number', path: 'phoneNumberInput', type: 'field', value: undefined },
          { location: 'body', msg: 'Enter a valid email address', path: 'emAddr', type: 'field', value: 'notAnEmail' },
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
            expect($('.govuk-error-summary__body a').eq(1).attr('href')).toBe('#phoneNumberInput-error')
            expect($('.govuk-error-summary__body').text()).toContain('Enter a valid email address')
            expect($('.govuk-error-summary__body a').eq(2).attr('href')).toBe('#emAddr-error')
            expect($('#contact-error').text()).toContain('No main contact selected')
            expect($('#phoneNumberInput-error').text()).toContain('Enter a phone number')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })

      it('should render validation errors from flash data for when no data or incorrect email entered', () => {
        flashData.errors = [
          {
            location: 'body',
            msg: 'Enter the name of the main contact',
            path: 'someoneElseName',
            type: 'field',
            value: '',
          },
          { location: 'body', msg: 'Enter a phone number', path: 'phoneNumberInput', type: 'field', value: '' },
          { location: 'body', msg: 'Enter a valid email address', path: 'emAddr', type: 'field', value: 'notAnEmail' },
        ]

        flashData.formValues = [{ contact: 'someoneElse', emAddr: 'notAnEmail' }]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-main-contact`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toContain('Who is the main contact for this booking?')
            expect($('.govuk-error-summary__body').text()).toContain('Enter the name of the main contact')
            expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
            expect($('.govuk-error-summary__body').text()).toContain('Enter a valid email address')
            expect($('#someoneElseName-error').text()).toContain('Enter the name of the main contact')
            expect($('#phoneNumberInput-error').text()).toContain('Enter a phone number')
            expect($('#emAddr-error').text()).toContain('Enter a valid email address')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/select-main-contact`, () => {
      const visitService = createMockVisitService()

      beforeEach(() => {
        const application: Partial<ApplicationDto> = {
          reference: visitSessionData.applicationReference,
        }

        visitService.changeVisitApplication = jest.fn().mockResolvedValue(application)

        sessionApp = appWithAllRoutes({
          services: { visitService },
          sessionData: {
            visitorList,
            visitSessionData,
          } as SessionData,
        })
      })

      it('should store contact data in session (named contact & phone number) and update the application then redirect to request method page', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({ contact: '123', phoneNumber: 'hasPhoneNumber', phoneNumberInput: ' 0114 1234 567 ' })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contactId).toBe(123)
            expect(visitSessionData.mainContact.relationshipDescription).toBe('relate')
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 1234 567')
            expect(visitSessionData.mainContact.email).toBeUndefined()
            expect(visitSessionData.mainContact.contactName).toBe('name last')

            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
          })
      })

      it('should store contact data in session (other contact & phone number) and update the application then redirect to request method page', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({
            contact: 'someoneElse',
            someoneElseName: '  another person  ',
            phoneNumber: 'hasPhoneNumber',
            phoneNumberInput: '0114 7654 321',
          })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contactId).toBe(undefined)
            expect(visitSessionData.mainContact.relationshipDescription).toBe(undefined)
            expect(visitSessionData.mainContact.contactName).toBe('another person')
            expect(visitSessionData.mainContact.email).toBeUndefined()
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')

            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
          })
      })

      it('should save new choice to session and redirect to request method page if existing session data present', () => {
        visitSessionData.mainContact = {
          contactId: 123,
          relationshipDescription: 'SISTER',
          phoneNumber: '0114 1234 567',
          email: 'visitor@example.com',
          contactName: undefined,
        }
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({
            contact: 'someoneElse',
            someoneElseName: '  another person  ',
            phoneNumber: 'hasPhoneNumber',
            phoneNumberInput: '0114 7654 321',
            emAddr: 'visitor@example.com',
          })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.mainContact.contactId).toBe(undefined)
            expect(visitSessionData.mainContact.relationshipDescription).toBe(undefined)
            expect(visitSessionData.mainContact.contactName).toBe('another person')
            expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
            expect(visitSessionData.mainContact.email).toBe('visitor@example.com')

            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
          })
      })

      it('should set validation errors in flash and redirect if no main contact selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({})
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-main-contact`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No main contact selected',
                path: 'contact',
                type: 'field',
                value: undefined,
              },
              {
                location: 'body',
                msg: 'No answer selected',
                path: 'phoneNumber',
                type: 'field',
                value: undefined,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { phoneNumberInput: '', someoneElseName: '' })

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should set validation errors in flash and redirect if someone else selected but no name entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({
            contact: 'someoneElse',
            someoneElseName: '',
            phoneNumber: 'hasPhoneNumber',
            phoneNumberInput: '',
          })
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
              { location: 'body', msg: 'Enter a phone number', path: 'phoneNumberInput', type: 'field', value: '' },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              contact: 'someoneElse',
              someoneElseName: '',
              phoneNumber: 'hasPhoneNumber',
              phoneNumberInput: '',
            })

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should set validation errors in flash and redirect if invalid data entered', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-main-contact`)
          .send({
            contact: 'non-existent',
            phoneNumber: 'hasPhoneNumber',
            phoneNumberInput: 'abc123',
            emAddr: 'notAnEmail',
          })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-main-contact`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
                path: 'phoneNumberInput',
                type: 'field',
                value: 'abc123',
              },
              {
                location: 'body',
                msg: 'Enter a valid email address',
                path: 'emAddr',
                type: 'field',
                value: 'notAnEmail',
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              contact: 'non-existent',
              phoneNumber: 'hasPhoneNumber',
              phoneNumberInput: 'abc123',
              someoneElseName: '',
              emAddr: 'notAnEmail',
            })

            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })
    })
  })
})
