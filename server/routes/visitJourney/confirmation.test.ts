import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import * as visitorUtils from '../visitorUtils'
import TestData from '../testutils/testData'

let sessionApp: Express

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

const availableSupportTypes = TestData.supportTypes()

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
  describe(`GET ${journey.urlPrefix}/confirmation`, () => {
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
        visitSlot: {
          id: 'visitId',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
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
        sessionData: {
          availableSupportTypes,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should render all data from the session', () => {
      return request(sessionApp)
        .get(`${journey.urlPrefix}/confirmation`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe(journey.isUpdate ? 'Booking updated' : 'Booking confirmed')
          expect($('main h2').first().text()).toBe(journey.isUpdate ? 'What happens next' : 'What to do next')
          expect($('.govuk-button--secondary').attr('href')).toBe('/prisoner/A1234BC')
          expect($('.test-visit-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-prisoner-number').text()).toContain('A1234BC')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-additional-support').text()).toContain(
            'Wheelchair ramp, Portable induction loop for people with hearing aids',
          )
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
          visitSlot: {
            id: 'visitId',
            prisonId: 'HEI',
            startTimestamp: '2022-03-12T09:30:00',
            endTimestamp: '2022-03-12T10:30:00',
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
          sessionData: {
            availableSupportTypes,
            visitSessionData,
          } as SessionData,
        })
      })

      it('should render all data from the session with a message for no selected additional support options', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/confirmation`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe(journey.isUpdate ? 'Booking updated' : 'Booking confirmed')
            expect($('main h2').first().text()).toBe(journey.isUpdate ? 'What happens next' : 'What to do next')
            expect($('.govuk-button--secondary').attr('href')).toBe('/prisoner/A1234BC')
            expect($('.test-visit-prisoner-name').text()).toContain('prisoner name')
            expect($('.test-visit-prisoner-number').text()).toContain('A1234BC')
            expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
            expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
            expect($('.test-visit-type').text()).toContain('Open')
            expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
            expect($('.test-additional-support').text()).toContain('None.')
            expect($('.test-main-contact-name').text()).toContain('abc')
            expect($('.test-main-contact-number').text()).toContain('123')
            expect($('.test-booking-reference').text()).toContain('ab-cd-ef-gh')

            expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
          })
      })
    })
  })
})
