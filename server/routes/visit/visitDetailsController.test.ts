import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { VisitBookingDetails } from '../../data/orchestrationApiTypes'
import TestData from '../testutils/testData'
import { createMockAuditService, createMockVisitService } from '../../services/testutils/mocks'
import { MojTimelineItem } from './visitEventsTimelineBuilder'
import { AvailableVisitActions } from './visitUtils'
import { MoJAlert } from '../../@types/bapv'

let app: Express

const auditService = createMockAuditService()
const visitService = createMockVisitService()

let availableVisitActions: AvailableVisitActions
let visitAlerts: MoJAlert[]
let visitEventsTimeline: MojTimelineItem[]
let visitorRestrictionIdsToFlag: number[]

jest.mock('./visitEventsTimelineBuilder', () => {
  return {
    __esModule: true,
    default: jest.fn(() => visitEventsTimeline),
  }
})

jest.mock('./visitUtils', () => {
  const visitUtils = jest.requireActual('./visitUtils')
  return {
    ...visitUtils,
    getAvailableVisitActions: () => availableVisitActions,
    getVisitAlerts: () => visitAlerts,
    getVisitorRestrictionIdsToFlag: () => visitorRestrictionIdsToFlag,
  }
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Visit details page', () => {
  let visitDetails: VisitBookingDetails

  visitEventsTimeline = [
    {
      label: { text: 'Booked' },
      text: `Method: Phone booking`,
      datetime: { timestamp: '2022-01-01T09:00:00', type: 'datetime' },
      byline: { text: 'User One' },
      attributes: { 'data-test': 'timeline-entry-0' },
    },
  ]

  beforeEach(() => {
    availableVisitActions = { update: false, cancel: false, clearNotifications: false, processRequest: false }
    visitAlerts = []
    visitorRestrictionIdsToFlag = []

    visitDetails = TestData.visitBookingDetails()

    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    visitService.getVisitDetailed.mockResolvedValue(visitDetails)

    app = appWithAllRoutes({ services: { auditService, visitService } })
  })

  describe('GET /visit/:reference', () => {
    it('should render full visit booking summary page', () => {
      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC')
          // messages
          expect($('.moj-alert').length).toBe(0)
          // visit details
          expect($('[data-test="visit-date"]').text()).toContain('Friday 14 January 2022')
          expect($('[data-test="visit-time"]').text()).toContain('10am to 11am')
          expect($('[data-test="visit-room"]').text()).toContain('Visit room 1')
          expect($('[data-test="visit-type"]').text()).toBe('Open visit')
          expect($('[data-test="visit-contact"]').text()).toBe('Jeanette Smith')
          expect($('[data-test="visit-phone"]').text()).toBe('01234 567890')
          expect($('[data-test="visit-email"]').text()).toBe('visitor@example.com')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="additional-support"]').text()).toContain('Wheelchair ramp')
          // actions forms
          expect($('[data-test=visit-actions]').length).toBe(0)
          expect($('[data-test=visit-request-actions]').length).toBe(0)
          // prisoner details
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
          expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
          expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
          expect($('[data-test="prisoner-age"]').text()).toBe('46 years old')
          expect($('[data-test="prisoner-restriction-1"]').text()).toContain('Restricted')
          expect($('[data-test="prisoner-restriction-1-start"]').text()).toContain('15/3/2022')
          expect($('[data-test="prisoner-restriction-1-end"]').text()).toContain('No end date')
          expect($('[data-test="prisoner-restriction-1-comment"]').text()).toContain('Details about this restriction')
          expect($('[data-test="all-alerts-link"]').attr('href')).toBe(
            'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC/alerts/active',
          )
          expect($('[data-test="prisoner-alert-1"]').text()).toContain('Protective Isolation Unit')
          expect($('[data-test="prisoner-alert-1-updated"]').text()).toContain('1/3/2023')
          expect($('[data-test="prisoner-alert-1-start"]').text()).toContain('2/1/2023')
          expect($('[data-test="prisoner-alert-1-end"]').text()).toContain('No end date')
          expect($('[data-test="prisoner-alert-1-comment"]').text()).toContain('Alert comment')
          // visitor details
          expect($('[data-test="visitor-name-1"]').text()).toBe('Jeanette Smith')
          expect($('[data-test="visitor-relation-1"]').text()).toBe('wife')
          expect($('[data-test="visitor-dob-1"]').text()).toMatch(/28 July 1986\s+\(35 years old\)/)
          expect($('[data-test="visitor-address-1"]').text()).toBe('123 The Street,\nCoventry')
          expect($('[data-test="visitor-1-restriction-1"]').text()).toContain('Closed')
          expect($('[data-test="visitor-1-restriction-1-start"]').text()).toContain('11/1/2022')
          expect($('[data-test="visitor-1-restriction-1-end"]').text()).toContain('13/2/2023')
          expect($('[data-test="visitor-1-restriction-1-comment"]').text()).toContain('closed comment text')

          // booking history
          expect($('[data-test="timeline-entry-0"] .moj-timeline__title').text()).toBe('Booked')
          expect($('[data-test="timeline-entry-0"] .moj-timeline__byline').text().trim().replace(/\s+/g, ' ')).toBe(
            'by User One',
          )
          expect($('[data-test="timeline-entry-0"] time').text()).toBe('Saturday 1 January 2022 at 9am')
          expect($('[data-test="timeline-entry-0"] .moj-timeline__description').text()).toBe('Method: Phone booking')

          expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
            visitReference: 'ab-cd-ef-gh',
            prisonerId: 'A1234BC',
            prisonId: 'HEI',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should render visit request title for a visit request', () => {
      visitDetails.visitSubStatus = 'REQUESTED'

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit request details')
        })
    })

    it('should handle no visit contact details', () => {
      visitDetails.visitContact.telephone = undefined
      visitDetails.visitContact.email = undefined

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-phone"]').length).toBe(0)
          expect($('[data-test="visit-email"]').length).toBe(0)
          expect($('[data-test="visit-no-contact-details"]').text()).toBe('No contact details provided')
        })
    })

    it('should show location as "Unknown" if prisoner is being transferred', () => {
      visitDetails.prisoner.prisonId = 'TRN'

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('[data-test="prisoner-location"]').text()).toBe('Unknown')
        })
    })

    it('should show the correct location for a prisoner who has been released', () => {
      visitDetails.prisoner.prisonId = 'OUT'
      visitDetails.prisoner.locationDescription = 'Outside - released from Hewell (HMP)'

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('[data-test="prisoner-location"]').text()).toBe(visitDetails.prisoner.locationDescription)
        })
    })

    it('should not show booking summary if selected establishment does not match prison for which visit booked', () => {
      const otherPrison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, activeCaseLoadId: otherPrison.prisonId }),
        services: { auditService, visitService },
        sessionData: {
          selectedEstablishment: otherPrison,
        } as SessionData,
      })

      return request(app)
        .get('/visit/ab-cd-ef-gh')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')

          expect(res.text).toContain(`This booking is not for ${otherPrison.prisonName}`)
          expect(res.text).toContain(`change the establishment to ${visitDetails.prison.prisonName}`)
        })
    })

    it('should render 400 Bad Request error for invalid visit reference', () => {
      return request(app)
        .get('/visit/12-34-56-78')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })

    describe('Back links', () => {
      it('should set correct back link when arriving from upcoming visits listing page', () => {
        const url =
          '/visit/ab-cd-ef-gh?from=visit-search&query=searchBlock1%3Dab%26searchBlock2%3Dcd%26searchBlock3%3Def%26searchBlock4%3Dgh'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe(
              '/search/visit/results?searchBlock1=ab&searchBlock2=cd&searchBlock3=ef&searchBlock4=gh',
            )
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })

      it('should set correct back link when arriving from view visits by date page', () => {
        const url =
          '/visit/ab-cd-ef-gh?query=type%3DOPEN%26sessionReference%3D-afe.dcc.0f%26selectedDate%3D2024-02-01%26firstTabDate%3D2024-02-01&from=visits'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe(
              '/visits?type=OPEN&sessionReference=-afe.dcc.0f&selectedDate=2024-02-01&firstTabDate=2024-02-01',
            )
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })

      it('should set correct back link when arriving from request listing page', () => {
        const url = '/visit/ab-cd-ef-gh?from=request'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe('/requested-visits')
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })

      it('should set correct back link when arriving from review listing page', () => {
        const url = '/visit/ab-cd-ef-gh?from=review'

        return request(app)
          .get(url)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text()).toBe('Visit booking details')
            expect($('.govuk-back-link').attr('href')).toBe('/review')
            expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
          })
      })
    })

    describe('Visit alert messages', () => {
      it('should render visit alert messages', () => {
        visitAlerts = [TestData.mojAlert({ title: 'alert title', text: 'alert text' })]

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.moj-alert').length).toBe(1)

            expect($('.moj-alert').eq(0).text()).toContain('alert title')
            expect($('.moj-alert').eq(0).text()).toContain('alert text')
          })
      })
    })

    describe('Visit action buttons', () => {
      it('should render no buttons if no available actions', () => {
        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=update-visit]').length).toBe(0)
            expect($('[data-test=cancel-visit]').length).toBe(0)
            expect($('[data-test=clear-notifications]').length).toBe(0)
          })
      })

      it('should render all buttons if all visit actions available', () => {
        availableVisitActions = { update: true, cancel: true, clearNotifications: true, processRequest: false }

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=visit-actions] form').attr('action')).toBe('/visit/ab-cd-ef-gh/update')

            expect($('[data-test=update-visit]').text().trim()).toBe('Update booking')

            expect($('[data-test=cancel-visit]').text().trim()).toBe('Cancel booking')
            expect($('[data-test=cancel-visit]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')

            expect($('[data-test=clear-notifications]').text().trim()).toBe('Do not change')
            expect($('[data-test=clear-notifications]').attr('href')).toBe('/visit/ab-cd-ef-gh/clear-notifications')
          })
      })

      it('should render approve and reject buttons if all visit request actions enabled', () => {
        availableVisitActions = { update: false, cancel: false, clearNotifications: false, processRequest: true }

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=update-visit]').length).toBe(0)
            expect($('[data-test=cancel-visit]').length).toBe(0)
            expect($('[data-test=clear-notifications]').length).toBe(0)

            expect($('[data-test=approve-visit-request]').text().trim()).toBe('Approve request')
            expect($('[data-test=approve-visit-request]').parent('form').attr('action')).toBe(
              '/visit/ab-cd-ef-gh/request/approve',
            )

            expect($('[data-test=reject-visit-request]').text().trim()).toBe('Reject request')
            expect($('[data-test=reject-visit-request]').parent('form').attr('action')).toBe(
              '/visit/ab-cd-ef-gh/request/reject',
            )
          })
      })
    })

    describe('Flag visitor restriction changes', () => {
      it('should flag a visitor restriction', () => {
        visitDetails.visitors[0].restrictions = [
          TestData.restriction({ restrictionId: 1 }),
          TestData.restriction({ restrictionId: 2 }),
        ]

        visitorRestrictionIdsToFlag = [2]

        return request(app)
          .get('/visit/ab-cd-ef-gh')
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=visitor-1-restriction-1]').length).toBe(1)
            expect($('[data-test=visitor-1-restriction-2]').length).toBe(1)

            expect($('.bapv-visit-details__restriction--flagged').length).toBe(1)
            expect($('.bapv-visit-details__restriction--flagged').text()).toBe(
              'This restriction has been added or updated',
            )
          })
      })
    })
  })
})
