import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData, VisitSlot, VisitSlotList } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { Visit } from '../../data/visitSchedulerApiTypes'
import { createMockAuditService, createMockVisitSessionsService } from '../../services/testutils/mocks'

let sessionApp: Express

const auditService = createMockAuditService()
const visitSessionsService = createMockVisitSessionsService()

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

const prisonId = 'HEI'

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    // @ts-ignore
    return flashData[key]
  })

  visitSessionData = {
    prisoner: {
      name: 'John Smith',
      offenderNo: 'A1234BC',
      dateOfBirth: '25 May 1988',
      location: 'location place',
    },
    visitRestriction: 'OPEN',
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
    visitReference: 'ab-cd-ef-gh',
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
            morning: [
              {
                id: '1',
                prisonId,
                startTimestamp: '2022-02-14T10:00:00',
                endTimestamp: '2022-02-14T11:00:00',
                availableTables: 15,
                capacity: 30,
                visitRoomName: 'room name',
                // representing a pre-existing visit that is BOOKED
                sessionConflicts: ['DOUBLE_BOOKED'],
                visitRestriction: 'OPEN',
              },
              {
                id: '2',
                prisonId,
                startTimestamp: '2022-02-14T11:59:00',
                endTimestamp: '2022-02-14T12:59:00',
                availableTables: 1,
                capacity: 30,
                visitRoomName: 'room name',
                visitRestriction: 'OPEN',
              },
            ],
            afternoon: [
              {
                id: '3',
                prisonId,
                startTimestamp: '2022-02-14T12:00:00',
                endTimestamp: '2022-02-14T13:05:00',
                availableTables: 5,
                capacity: 30,
                visitRoomName: 'room name',
                // representing the RESERVED visit being handled in this session
                sessionConflicts: ['DOUBLE_BOOKED'],
                visitRestriction: 'OPEN',
              },
            ],
          },
        },
      ],
    }

    beforeEach(() => {
      visitSessionsService.getVisitSessions.mockResolvedValue({ slotsList, whereaboutsAvailable: true })
    })

    describe(`GET ${journey.urlPrefix}/select-date-and-time`, () => {
      it('should render the available sessions list with none selected', () => {
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
            expect($('input[name="visit-date-and-time"]').length).toBe(3)
            expect($('input[name="visit-date-and-time"]:checked').length).toBe(0)
            expect($('.govuk-accordion__section--expanded').length).toBe(0)

            expect($('label[for="1"]').text()).toContain('Prisoner has a visit')
            expect($('#1').attr('disabled')).toBe('disabled')

            expect($('[data-test="submit"]').text().trim()).toBe('Continue')
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
            expect($('#main-content').text()).toContain('There are no available slots for the selected time and day.')
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

      it('should render the available sessions list with the slot in the session selected', () => {
        visitSessionData.visitSlot = {
          id: '3',
          prisonId,
          startTimestamp: '2022-02-14T12:00:00',
          endTimestamp: '2022-02-14T13:05:00',
          availableTables: 5,
          capacity: 30,
          visitRoomName: 'room name',
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
            expect($('input[name="visit-date-and-time"]').length).toBe(3)
            expect($('.govuk-accordion__section--expanded').length).toBe(1)
            expect($('.govuk-accordion__section--expanded #3').length).toBe(1)
            expect($('input#3').prop('checked')).toBe(true)
            expect($('[data-test="submit"]').text().trim()).toBe('Continue')
          })
      })

      it('should render validation errors from flash data for invalid input', () => {
        flashData.errors = [{ location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time' }]

        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-date-and-time`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('h1').text().trim()).toBe('Select date and time of visit')
            expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
            expect($('.govuk-error-summary__body').text()).toContain('No time slot selected')
            expect(flashProvider).toHaveBeenCalledWith('errors')
            expect(flashProvider).toHaveBeenCalledWith('formValues')
            expect(flashProvider).toHaveBeenCalledTimes(2)
          })
      })
    })

    describe(`POST ${journey.urlPrefix}/select-date-and-time`, () => {
      const reservedVisit: Partial<Visit> = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      }

      // representing a BOOKED visit on update journey that has moved to status CHANGING
      const changingVisit: Partial<Visit> = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        visitStatus: 'CHANGING',
      }

      beforeEach(() => {
        visitSessionsService.reserveVisit = jest.fn().mockResolvedValue(reservedVisit)
        visitSessionsService.changeBookedVisit = jest.fn().mockResolvedValue(changingVisit)
        visitSessionsService.changeReservedVisit = jest.fn()

        sessionApp = appWithAllRoutes({
          services: { auditService, visitSessionsService },
          sessionData: {
            slotsList,
            visitSessionData,
          } as SessionData,
        })
      })

      it('should save to session, reserve visit and redirect to additional support page if slot selected', () => {
        visitSessionData.visitReference = journey.isUpdate ? reservedVisit.reference : undefined

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=2')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toEqual(<VisitSlot>{
              id: '2',
              prisonId,
              startTimestamp: '2022-02-14T11:59:00',
              endTimestamp: '2022-02-14T12:59:00',
              availableTables: 1,
              capacity: 30,
              visitRoomName: 'room name',
              visitRestriction: 'OPEN',
            })
            expect(visitSessionData.applicationReference).toEqual(reservedVisit.applicationReference)
            expect(visitSessionData.visitReference).toEqual(reservedVisit.reference)
            expect(visitSessionData.visitStatus).toEqual(
              journey.isUpdate ? changingVisit.visitStatus : reservedVisit.visitStatus,
            )

            expect(
              journey.isUpdate ? visitSessionsService.changeBookedVisit : visitSessionsService.reserveVisit,
            ).toHaveBeenCalledTimes(1)
            expect(visitSessionsService.changeReservedVisit).not.toHaveBeenCalled()

            expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: reservedVisit.applicationReference,
              visitReference: reservedVisit.reference,
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

      it('should save new choice to session, update visit reservation and redirect to additional support page if existing session data present', () => {
        visitSessionData.visitSlot = {
          id: '1',
          prisonId,
          startTimestamp: '2022-02-14T10:00:00',
          endTimestamp: '2022-02-14T11:00:00',
          availableTables: 15,
          capacity: 30,
          visitRoomName: 'room name',
          visitRestriction: 'OPEN',
        }

        visitSessionData.applicationReference = reservedVisit.applicationReference
        visitSessionData.visitReference = reservedVisit.reference
        visitSessionData.visitStatus = journey.isUpdate ? changingVisit.visitStatus : reservedVisit.visitStatus

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-date-and-time`)
          .send('visit-date-and-time=3')
          .expect(302)
          .expect('location', `${journey.urlPrefix}/additional-support`)
          .expect(() => {
            expect(visitSessionData.visitSlot).toEqual(<VisitSlot>{
              id: '3',
              prisonId,
              startTimestamp: '2022-02-14T12:00:00',
              endTimestamp: '2022-02-14T13:05:00',
              availableTables: 5,
              capacity: 30,
              visitRoomName: 'room name',
              // representing the RESERVED visit being handled in this session
              sessionConflicts: ['DOUBLE_BOOKED'],
              visitRestriction: 'OPEN',
            })

            expect(visitSessionData.applicationReference).toEqual(reservedVisit.applicationReference)
            expect(visitSessionData.visitReference).toEqual(reservedVisit.reference)
            expect(visitSessionData.visitStatus).toEqual(
              journey.isUpdate ? changingVisit.visitStatus : reservedVisit.visitStatus,
            )

            expect(visitSessionsService.reserveVisit).not.toHaveBeenCalled()
            expect(visitSessionsService.changeReservedVisit).toHaveBeenCalledTimes(1)
            expect(
              visitSessionsService.changeReservedVisit.mock.calls[0][0].visitSessionData.applicationReference,
            ).toBe(reservedVisit.applicationReference)
            expect(visitSessionsService.changeReservedVisit.mock.calls[0][0].visitSessionData.visitReference).toBe(
              reservedVisit.reference,
            )

            expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
            expect(auditService.reservedVisit).toHaveBeenCalledWith({
              applicationReference: reservedVisit.applicationReference,
              visitReference: reservedVisit.reference,
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
              { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: undefined },
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
              { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '100' },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '100' })
            expect(auditService.reservedVisit).not.toHaveBeenCalled()
          })
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

    // Allowing over-booing is OK because the original visit (being updated) is one of the already-booked spaces
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
