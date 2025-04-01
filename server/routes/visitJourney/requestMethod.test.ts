import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitSessionData } from '../../@types/bapv'
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
  describe(`${journey.urlPrefix}/request-method`, () => {
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
          id: 'visitId',
          sessionTemplateReference: 'ab-cd-ef',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
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
            address: '123 Street,\nTest Town,\nS1 2QZ',
            banned: false,
          },
        ],
        visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
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

    describe(`GET ${journey.urlPrefix}/request-method`, () => {
      it('should render the request method page with all options and none pre-selected', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/request-method`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('How was this booking requested?')
            expect($('input[name="method"]').length).toBe(5)
            expect($('input[name="method"]:checked').length).toBe(0)
            expect($('input[name="method"]').eq(0).prop('value')).toBe('PHONE')
            expect($('input[name="method"]').eq(1).prop('value')).toBe('WEBSITE')
            expect($('input[name="method"]').eq(2).prop('value')).toBe('EMAIL')
            expect($('input[name="method"]').eq(3).prop('value')).toBe('IN_PERSON')
            expect($('input[name="method"]').eq(4).prop('value')).toBe('BY_PRISONER')
          })
      })

      it('should render validation errors from flash data for when no data entered', () => {
        flashData.errors = [
          { location: 'body', msg: 'No request method selected', path: 'method', type: 'field', value: undefined },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/request-method`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('How was this booking requested?')
            expect($('#method-error').text()).toContain('No request method selected')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/request-method`, () => {
      it('should redirect to check answers page and store in session if VALID request method selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/request-method`)
          .send('method=PHONE')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/check-your-booking`)
          .expect(() => {
            expect(visitSessionData.requestMethod).toEqual('PHONE')
          })
      })
      it('should not redirect to check answers page if INVALID request method selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/request-method`)
          .send('method=somestring')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.requestMethod).toEqual(undefined)
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No request method selected',
                path: 'method',
                type: 'field',
                value: 'somestring',
              },
            ])
          })
      })
      it('should not redirect to check answers page if NO request method selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/request-method`)
          .send('method=')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/request-method`)
          .expect(() => {
            expect(visitSessionData.requestMethod).toEqual(undefined)
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No request method selected',
                path: 'method',
                type: 'field',
                value: '',
              },
            ])
          })
      })
    })
  })
})
