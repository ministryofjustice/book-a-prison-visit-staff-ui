import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockAuditService } from '../../services/testutils/mocks'

let sessionApp: Express

let flashData: FlashData

const auditService = createMockAuditService()

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [{ urlPrefix: '/book-a-visit' }, { urlPrefix: '/visit/ab-cd-ef-gh/update' }]

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
  describe(`Select visit type: ${journey.urlPrefix}/visit-type`, () => {
    beforeEach(() => {
      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          firstName: 'prisoner',
          lastName: 'name',
          offenderNo: 'A1234BC',
          location: 'location place',
          restrictions: [
            {
              restrictionId: 12345,
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-05-16',
              comment: 'some comment text',
              active: true,
            },
          ],
        },
        visitRestriction: 'OPEN',
        visitorIds: [4322],
        visitors: [
          {
            address: '1st listed address',
            adult: true,
            dateOfBirth: '1986-07-28',
            name: 'Bob Smith',
            personId: 4322,
            relationshipDescription: 'Brother',
            restrictions: [],
            banned: false,
          },
        ],
        visitReference: 'ab-cd-ef-gh',
      }

      sessionApp = appWithAllRoutes({
        services: { auditService },
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    describe(`GET ${journey.urlPrefix}/visit-type`, () => {
      it('should render the open/closed visit type page with prisoner restrictions and visitor list', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/visit-type`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe("Check the prisoner's closed visit restrictions")
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('[data-test="restriction-type-1"]').text().trim()).toBe('Closed')
            expect($('[data-test="restriction-comment-1"]').text().trim()).toBe('some comment text')
            expect($('[data-test="restriction-start-1"]').text().trim()).toBe('16 May 2022')
            expect($('[data-test="restriction-end-1"]').text().trim()).toBe('Not entered')
            expect($('.test-visitor-key-1').text().trim()).toBe('Visitor 1')
            expect($('.test-visitor-value-1').text().trim()).toBe('Bob Smith (brother of the prisoner)')
            expect($('[data-test="visit-type-open"]').prop('checked')).toBe(false)
            expect($('[data-test="visit-type-closed"]').prop('checked')).toBe(false)
          })
      })

      it('should render the open/closed visit type page with form validation errors', () => {
        flashData.errors = [
          {
            msg: 'No visit type selected',
            path: 'visitType',
            type: 'field',
            location: 'body',
          },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/visit-type`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe("Check the prisoner's closed visit restrictions")
            expect($('.govuk-back-link').attr('href')).toBe(`${journey.urlPrefix}/select-visitors`)
            expect($('.govuk-error-summary__body').text()).toContain('No visit type selected')
            expect($('.govuk-error-summary__body a').attr('href')).toBe('#visitType-error')
            expect($('#visitType-error').text()).toContain('No visit type selected')
            expect($('[data-test="visit-type-open"]').prop('checked')).toBe(false)
            expect($('[data-test="visit-type-closed"]').prop('checked')).toBe(false)
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledTimes(1)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/visit-type`, () => {
      it('should set validation errors in flash and redirect if visit type not selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/visit-type`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/visit-type`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              { location: 'body', msg: 'No visit type selected', path: 'visitType', type: 'field', value: undefined },
            ])
          })
      })

      it('should set visit type to OPEN when selected and redirect to select date/time', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/visit-type`)
          .send('visitType=OPEN')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(visitSessionData.visitRestriction).toBe('OPEN')
            expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
            expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith({
              prisonerId: visitSessionData.prisoner.offenderNo,
              visitRestriction: 'OPEN',
              visitorIds: [visitSessionData.visitors[0].personId.toString()],
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should set visit type to CLOSED when selected and redirect to select date/time', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/visit-type`)
          .send('visitType=CLOSED')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(visitSessionData.visitRestriction).toBe('CLOSED')
            expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
            expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith({
              prisonerId: visitSessionData.prisoner.offenderNo,
              visitRestriction: 'CLOSED',
              visitorIds: [visitSessionData.visitors[0].personId.toString()],
              username: 'user1',
              operationId: undefined,
            })
          })
      })
    })
  })
})
