import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitSessionData, VisitSlot, VisitSlotList } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { ApplicationDto } from '../../data/orchestrationApiTypes'
import {
  createMockAuditService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../../services/testutils/mocks'
import TestData from '../testutils/testData'

let sessionApp: Express

let flashData: FlashData

const auditService = createMockAuditService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

const prisonId = 'HEI'

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

const visitSlot1: VisitSlot = {
  id: '1',
  sessionTemplateReference: 'v9d.7ed.7u1',
  prisonId,
  startTimestamp: '2022-02-14T10:00:00',
  endTimestamp: '2022-02-14T11:00:00',
  availableTables: 15,
  capacity: 30,
  visitRoom: 'room name',
  // representing a pre-existing visit that is BOOKED
  sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
  visitRestriction: 'OPEN',
}

const visitSlot2: VisitSlot = {
  id: '2',
  sessionTemplateReference: 'v9d.7ed.7u2',
  prisonId,
  startTimestamp: '2022-02-14T11:59:00',
  endTimestamp: '2022-02-14T12:59:00',
  availableTables: 1,
  capacity: 30,
  visitRoom: 'room name',
  visitRestriction: 'OPEN',
}

const visitSlot3: VisitSlot = {
  id: '3',
  sessionTemplateReference: 'v9d.7ed.7u3',
  prisonId,
  startTimestamp: '2022-02-14T12:00:00',
  endTimestamp: '2022-02-14T13:05:00',
  availableTables: 5,
  capacity: 30,
  visitRoom: 'room name',
  // representing the RESERVED visit being handled in this session
  sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
  visitRestriction: 'OPEN',
}

const visitSlot4: VisitSlot = {
  id: '4',
  sessionTemplateReference: 'a1b.2cd.3e4',
  prisonId,
  startTimestamp: '2022-02-14T15:30:00',
  endTimestamp: '2022-02-14T16:35:00',
  availableTables: 0, // used for confirm overbooking page (no available tables)
  capacity: 5,
  visitRoom: 'room name',
  visitRestriction: 'OPEN',
}

beforeEach(() => {
  flashData = { errors: [], formValues: [], messages: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })

  visitSessionData = {
    allowOverBooking: false,
    prisoner: {
      name: 'John Smith',
      offenderNo: 'A1234BC',
      location: 'location place',
    },
    visitRestriction: 'OPEN',
    visitorIds: [4323],
    visitors: [
      {
        personId: 4323,
        name: 'Ted Smith',
        dateOfBirth: '1968-07-28',
        adult: true,
        relationshipDescription: 'Father',
        address: '1st listed address',
        restrictions: [],
        banned: false,
      },
    ],
  }

  sessionApp = appWithAllRoutes({
    services: { visitSessionsService },
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

testJourneys.forEach(journey => {
  describe(`Select date and time: ${journey.urlPrefix}/select-date-and-time`, () => {
    const slotsList: VisitSlotList = {
      'February 2022': [
        {
          date: 'Monday 14 February',
          prisonerEvents: {
            morning: [],
            afternoon: [],
          },
          slots: {
            morning: [visitSlot1, visitSlot2],
            afternoon: [visitSlot3, visitSlot4],
          },
        },
      ],
    }

    beforeEach(() => {
      // visit reference only known on update journey
      visitSessionData.visitReference = journey.isUpdate ? 'ab-cd-ef-gh' : undefined
      visitSessionData.originalVisitSlot = journey.isUpdate ? visitSlot1 : undefined

      visitSessionsService.getVisitSessions.mockResolvedValue({ slotsList, whereaboutsAvailable: true })
    })

    describe(`GET ${journey.urlPrefix}/select-date-and-time`, () => {
      it('should render the available sessions list with none selected', () => {
        visitSessionData.originalVisitSlot = journey.isUpdate ? visitSlot2 : undefined

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('[data-test="visit-location"]').text()).toBe('location place')
            expect($('[data-test="visit-restriction"]').text()).toBe('Open')
            expect($('[data-test="closed-visit-reason"]').length).toBe(0)
            expect($('[data-test="whereabouts-unavailable"]').length).toBe(0)
            expect($('input[name="visit-date-and-time"]').length).toBe(4)
            expect($('input[name="visit-date-and-time"]:checked').length).toBe(0)
            expect($('.govuk-accordion__section--expanded').length).toBe(0)

            expect($('label[for="1"]').text()).toContain('Prisoner has a visit')
            expect($('#1').attr('disabled')).toBe('disabled')

            expect($('[data-test="submit"]').text().trim()).toBe('Continue')

            expect(visitSessionsService.getVisitSessions).toHaveBeenCalledWith({
              username: 'user1',
              offenderNo: visitSessionData.prisoner.offenderNo,
              prisonId,
              visitRestriction: visitSessionData.visitRestriction,
              minNumberOfDays: '2',
            })
          })
      })

      it('should render the available sessions list for CLOSED restriction', () => {
        visitSessionData.visitRestriction = 'CLOSED'

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('[data-test="visit-location"]').text()).toBe('location place')
            expect($('[data-test="visit-restriction"]').text()).toBe('Closed')
            expect($('[data-test="whereabouts-unavailable"]').length).toBe(0)
          })
      })

      it('should show message if no sessions are available', () => {
        visitSessionsService.getVisitSessions.mockResolvedValue({ slotsList: {}, whereaboutsAvailable: true })

        sessionApp = appWithAllRoutes({
          services: { visitSessionsService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('#main-content').text()).toContain('There are no available time slots for this prisoner.')
            expect($('input[name="visit-date-and-time"]').length).toBe(0)
            expect($('[data-test="whereabouts-unavailable"]').length).toBe(0)
            expect($('[data-test="submit"]').length).toBe(0)
            expect($('[data-test="back-to-start"]').length).toBe(1)
          })
      })

      it('should show warning message when whereabouts data is not available', () => {
        visitSessionsService.getVisitSessions.mockResolvedValue({ slotsList, whereaboutsAvailable: false })

        sessionApp = appWithAllRoutes({
          services: { visitSessionsService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('[data-test="whereabouts-unavailable"]').text().trim()).toContain(
              'The prisoner schedule is unavailable. Check NOMIS for court appearances. Prison number: A1234BC',
            )
            expect($('[data-test="submit"]').text().trim()).toBe('Continue')
          })
      })

      it('should show warning message when visitor has an expiring ban', () => {
        // example visitor data for a visitor ban
        visitSessionData.visitors = [
          {
            personId: 4323,
            name: 'Ted Smith',
            dateOfBirth: '1968-07-28',
            adult: true,
            relationshipDescription: 'Father',
            address: '1st listed address',
            restrictions: [
              {
                restrictionType: 'BAN',
                restrictionTypeDescription: 'Banned',
                startDate: '2022-01-01',
                expiryDate: '2023-01-14',
                comment: 'Ban details',
              },
            ],
            banned: false,
          },
        ]
        // this is added to the visitSessionData on the select visitors page, matches the expiry date of the visitor ban
        visitSessionData.daysUntilBanExpiry = 3

        sessionApp = appWithAllRoutes({
          services: { visitSessionsService },
          sessionData: {
            visitSessionData,
          } as SessionData,
        })

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="banned-visitor-reason"]').text().trim()).toContain(
              'A selected visitor is banned. Time slots during the period of the ban are not shown',
            )
          })
      })

      it('should render the available sessions list with the slot in the session selected', () => {
        visitSessionData.visitSlot = {
          id: '3',
          sessionTemplateReference: 'v9d.7ed.7u3',
          prisonId,
          startTimestamp: '2022-02-14T12:00:00',
          endTimestamp: '2022-02-14T13:05:00',
          availableTables: 5,
          capacity: 30,
          visitRoom: 'room name',
          visitRestriction: 'OPEN',
        }

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('input[name="visit-date-and-time"]').length).toBe(4)
            expect($('.govuk-accordion__section--expanded').length).toBe(1)
            expect($('.govuk-accordion__section--expanded #3').length).toBe(1)
            expect($('input#3').prop('checked')).toBe(true)
            expect($('[data-test="submit"]').text().trim()).toBe('Continue')
          })
      })

      it('should render validation errors from flash data for invalid input', () => {
        flashData.errors = [
          { location: 'body', msg: 'No time slot selected', path: 'visit-date-and-time', type: 'field' },
        ]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('.govuk-error-summary__body').text()).toContain('No time slot selected')
            expect($('.govuk-error-summary__body a').attr('href')).toBe('#visit-date-and-time-error')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledWith('messages')
            expect(flashProvider).toHaveBeenCalledTimes(3)
          })
      })

      it('should render error from 422 errors - non association', () => {
        flashData.messages = [TestData.mojAlert()]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('.moj-alert__content h2').text()).toContain('Another person has booked the last table.')
            expect($('.moj-alert').text()).toContain('Select whether to book for this time or choose a new visit time.')
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/select-date-and-time`, () => {
      const application: Partial<ApplicationDto> = {
        reference: 'aaa-bbb-ccc',
      }

      beforeEach(() => {
        visitService.createVisitApplication = jest.fn().mockResolvedValue(application)
        visitService.createVisitApplicationFromVisit = jest.fn().mockResolvedValue(application)
        visitService.changeVisitApplication = jest.fn()

        sessionApp = appWithAllRoutes({
          services: { auditService, visitService },
          sessionData: {
            slotsList,
            visitSessionData,
          } as SessionData,
        })
      })

      it('should save to session, create a visit application and redirect to additional support page if slot selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=2')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toEqual(<VisitSlot>{
              id: '2',
              sessionTemplateReference: 'v9d.7ed.7u2',
              prisonId,
              startTimestamp: '2022-02-14T11:59:00',
              endTimestamp: '2022-02-14T12:59:00',
              availableTables: 1,
              capacity: 30,
              visitRoom: 'room name',
              visitRestriction: 'OPEN',
            })
            expect(visitSessionData.applicationReference).toEqual(application.reference)

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).toHaveBeenCalledWith({ username: 'user1', visitSessionData })
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

            expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
              visitReference: visitSessionData.visitReference,
              prisonerId: 'A1234BC',
              prisonId,
              visitorIds: ['4323'],
              startTimestamp: '2022-02-14T11:59:00',
              endTimestamp: '2022-02-14T12:59:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should save new choice to session, update visit application and redirect to additional support page if existing session data present', () => {
        visitSessionData.applicationReference = application.reference

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=3')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toEqual(<VisitSlot>{
              id: '3',
              sessionTemplateReference: 'v9d.7ed.7u3',
              prisonId,
              startTimestamp: '2022-02-14T12:00:00',
              endTimestamp: '2022-02-14T13:05:00',
              availableTables: 5,
              capacity: 30,
              visitRoom: 'room name',
              // representing the visit application visit being handled in this session
              sessionConflicts: ['DOUBLE_BOOKING_OR_RESERVATION'],
              visitRestriction: 'OPEN',
            })

            expect(visitSessionData.applicationReference).toEqual(application.reference)

            expect(visitService.createVisitApplication).not.toHaveBeenCalled()
            expect(visitService.createVisitApplicationFromVisit).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({ username: 'user1', visitSessionData })

            expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
              visitReference: visitSessionData.visitReference,
              prisonerId: 'A1234BC',
              prisonId,
              visitorIds: ['4323'],
              startTimestamp: '2022-02-14T12:00:00',
              endTimestamp: '2022-02-14T13:05:00',
              visitRestriction: 'OPEN',
              username: 'user1',
              operationId: undefined,
            })
          })
      })

      it('should should set validation errors in flash and redirect if no slot selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No time slot selected',
                path: 'visit-date-and-time',
                type: 'field',
                value: undefined,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {})
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
      })

      it('should should set validation errors in flash and redirect if invalid slot selected', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=100')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'No time slot selected',
                path: 'visit-date-and-time',
                type: 'field',
                value: '100',
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '100' })
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
      })

      it('should re-direct to overbooking page if session has no available slots', () => {
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=4')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time/overbooking`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toEqual(<VisitSlot>{
              id: '4',
              sessionTemplateReference: 'a1b.2cd.3e4',
              prisonId,
              startTimestamp: '2022-02-14T15:30:00',
              endTimestamp: '2022-02-14T16:35:00',
              availableTables: 0,
              capacity: 5,
              visitRoom: 'room name',
              visitRestriction: 'OPEN',
            })
            expect(visitSessionData.applicationReference).not.toBeDefined()

            expect(
              journey.isUpdate ? visitService.createVisitApplicationFromVisit : visitService.createVisitApplication,
            ).toHaveBeenCalledTimes(0)
            expect(visitService.changeVisitApplication).toHaveBeenCalledTimes(0)
            expect(auditService.reservedVisit).toHaveBeenCalledTimes(0)
          })
      })
    })
  })
})

describe('Update journey override booking window', () => {
  it('should override booking window min days to 0 if confirmation set in session', () => {
    visitSessionsService.getVisitSessions.mockResolvedValue({
      slotsList: {},
      whereaboutsAvailable: false,
    })

    visitSessionData.visitReference = 'ab-cd-ef-gh'
    visitSessionData.overrideBookingWindow = true

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select date and time of visit')

        expect(visitSessionsService.getVisitSessions).toHaveBeenCalledWith({
          username: 'user1',
          offenderNo: visitSessionData.prisoner.offenderNo,
          prisonId,
          visitRestriction: visitSessionData.visitRestriction,
          minNumberOfDays: '0',
        })
      })
  })
})

describe('Update journey specific warning messages', () => {
  let currentlyBookedSlot: VisitSlot
  let slotsList: VisitSlotList
  let currentlyAvailableSlots: VisitSlot[]

  beforeEach(() => {
    currentlyBookedSlot = {
      id: '',
      prisonId,
      startTimestamp: '2022-10-17T09:00:00',
      endTimestamp: '2022-10-17T10:00:00',
    } as VisitSlot

    slotsList = {
      'October 2022': [
        {
          date: 'Monday 17 October',
          prisonerEvents: {
            morning: [],
            afternoon: [],
          },
          slots: {
            morning: [
              {
                id: '1',
                startTimestamp: '2022-10-17T09:00:00',
                endTimestamp: '2022-10-17T10:00:00',
                availableTables: 15,
                capacity: 30,
              } as VisitSlot,
            ],
            afternoon: [],
          },
        },
      ],
    }
    currentlyAvailableSlots = slotsList['October 2022'][0].slots.morning

    visitSessionsService.getVisitSessions.mockResolvedValue({ slotsList, whereaboutsAvailable: true })

    visitSessionData.visitReference = 'ab-cd-ef-gh'
    visitSessionData.visitSlot = currentlyBookedSlot
    visitSessionData.originalVisitSlot = currentlyBookedSlot
  })

  it('should select original slot with no messages if no restriction change and original time available', () => {
    currentlyBookedSlot.visitRestriction = 'OPEN'

    // No capacity is OK because the original visit (being updated) is one of the already-booked spaces
    currentlyAvailableSlots[0].availableTables = 0
    currentlyAvailableSlots[0].visitRestriction = 'OPEN'

    visitSessionData.visitRestriction = 'OPEN'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').length).toBe(0)
        expect($('[data-test="restriction-change-reason"]').length).toBe(0)
        expect($('input#1').prop('checked')).toBe(true)
      })
  })

  it('should select original slot with no messages if no restriction change and original time available (even if overbooked)', () => {
    currentlyBookedSlot.visitRestriction = 'OPEN'

    // Allowing over-booking is OK because the original visit (being updated) is one of the already-booked spaces
    currentlyAvailableSlots[0].availableTables = -1
    currentlyAvailableSlots[0].visitRestriction = 'OPEN'

    visitSessionData.visitRestriction = 'OPEN'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').length).toBe(0)
        expect($('[data-test="restriction-change-reason"]').length).toBe(0)
        expect($('input#1').prop('checked')).toBe(true)
      })
  })

  it('should show two messages with no slot selected when visit has changed from open to closed and original time slot unavailable', () => {
    currentlyBookedSlot.visitRestriction = 'OPEN'

    currentlyAvailableSlots[0].startTimestamp = '2022-10-17T09:01:00'
    currentlyAvailableSlots[0].visitRestriction = 'CLOSED'

    visitSessionData.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').text()).toContain('A new visit time must be selected.')
        expect($('[data-test="restriction-change-reason"]').text()).toContain(
          'The visit type has changed from open to closed.',
        )
        expect($('input:checked').length).toBe(0)
      })
  })

  it('should show two messages with no slot selected when visit has changed from closed to open and original time slot unavailable', () => {
    currentlyBookedSlot.visitRestriction = 'CLOSED'

    currentlyAvailableSlots[0].startTimestamp = '2022-10-17T09:01:00'
    currentlyAvailableSlots[0].visitRestriction = 'OPEN'

    visitSessionData.visitRestriction = 'OPEN'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').text()).toContain('A new visit time must be selected.')
        expect($('[data-test="restriction-change-reason"]').text()).toContain(
          'The visit type has changed from closed to open.',
        )
        expect($('input:checked').length).toBe(0)
      })
  })

  it('should show one message with original slot selected when visit has changed from open to closed and original time slot available', () => {
    currentlyBookedSlot.visitRestriction = 'OPEN'

    currentlyAvailableSlots[0].visitRestriction = 'CLOSED'

    visitSessionData.visitRestriction = 'CLOSED'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').length).toBe(0)
        expect($('[data-test="restriction-change-reason"]').text()).toContain(
          'The visit type has changed from open to closed.',
        )
        expect($('input#1').prop('checked')).toBe(true)
      })
  })

  it('should show one message with original slot selected when visit has changed from closed to open and original time slot available', () => {
    currentlyBookedSlot.visitRestriction = 'CLOSED'

    currentlyAvailableSlots[0].visitRestriction = 'OPEN'

    visitSessionData.visitRestriction = 'OPEN'

    return request(sessionApp)
      .get('/visit/ab-cd-ef-gh/update/select-date-and-time')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="slot-change-reason"]').length).toBe(0)
        expect($('[data-test="restriction-change-reason"]').text()).toContain(
          'The visit type has changed from closed to open.',
        )
        expect($('input#1').prop('checked')).toBe(true)
      })
  })
})
