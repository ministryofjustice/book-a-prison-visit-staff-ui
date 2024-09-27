import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitSessionsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'

let sessionApp: Express

const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`${journey.urlPrefix}/confirm-overbooking`, () => {
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
          sessionTemplateReference: 'ab-cd-ef',
          prisonId: 'HEI',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
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
        visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
        applicationReference: 'aaa-bbb-ccc',
        // visit reference only known on update journey
        visitReference: journey.isUpdate ? 'ab-cd-ef-gh' : undefined,
        requestMethod: 'BY_PRISONER',
      }

      sessionApp = appWithAllRoutes({
        services: { visitSessionsService },
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    describe(`GET ${journey.urlPrefix}/confirm-overbooking`, () => {
      it('should render the confirm overbooking page with all session information (Open)', () => {
        const visitSession = TestData.visitSession({ openVisitBookedCount: 20, openVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        return request(sessionApp)
          .get(`${journey.urlPrefix}/confirm-overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h2').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('[data-test=bookings-count]').text().trim()).toBe(visitSession.openVisitBookedCount.toString())
            expect($('[data-test=max-capacity]').text().trim()).toBe(visitSession.openVisitCapacity.toString())
            expect($('[data-test=visit-start-time]').text().trim()).toBe('10am')
            expect($('[data-test=visit-end-time]').text().trim()).toBe('11am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Friday 14 January')
          })
      })

      it('should render the confirm overbooking page with all session information (Closed)', () => {
        const visitSession = TestData.visitSession({ closedVisitBookedCount: 10, closedVisitCapacity: 20 })
        visitSessionsService.getSingleVisitSession.mockResolvedValue(visitSession)
        visitSessionData.visitSlot.visitRestriction = 'CLOSED'
        return request(sessionApp)
          .get(`${journey.urlPrefix}/confirm-overbooking`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h2').text().trim()).toBe('This time slot is fully booked. Are you sure you want to continue?')
            expect($('[data-test=bookings-count]').text().trim()).toBe(visitSession.closedVisitBookedCount.toString())
            expect($('[data-test=max-capacity]').text().trim()).toBe(visitSession.closedVisitCapacity.toString())
            expect($('[data-test=visit-start-time]').text().trim()).toBe('10am')
            expect($('[data-test=visit-end-time]').text().trim()).toBe('11am')
            expect($('[data-test=visit-date]').text().trim()).toBe('Friday 14 January')
          })
      })
    })
  })
})
