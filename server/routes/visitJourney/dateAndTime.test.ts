import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitSessionData, VisitSlot, VisitSlotList } from '../../@types/bapv'
import VisitSessionsService from '../../services/visitSessionsService'
import AuditService from '../../services/auditService'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { Visit } from '../../data/visitSchedulerApiTypes'

jest.mock('../../services/visitSessionsService')
jest.mock('../../services/auditService')

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
const auditService = new AuditService() as jest.Mocked<AuditService>

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/book-a-visit/select-date-and-time', () => {
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
      {
        date: 'Tuesday 15 February',
        prisonerEvents: {
          morning: [],
          afternoon: [],
        },
        slots: {
          morning: [],
          afternoon: [
            {
              id: '4',
              startTimestamp: '2022-02-15T16:00:00',
              endTimestamp: '2022-02-15T17:00:00',
              availableTables: 12,
              capacity: 30,
              visitRoomName: 'room name',
              visitRestriction: 'OPEN',
            },
          ],
        },
      },
    ],
    'March 2022': [
      {
        date: 'Tuesday 1 March',
        prisonerEvents: {
          morning: [],
          afternoon: [],
        },
        slots: {
          morning: [
            {
              id: '5',
              startTimestamp: '2022-03-01T09:30:00',
              endTimestamp: '2022-03-01T10:30:00',
              availableTables: 0,
              capacity: 30,
              visitRoomName: 'room name',
              visitRestriction: 'OPEN',
            },
          ],
          afternoon: [],
        },
      },
    ],
  }

  beforeEach(() => {
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
    }
  })

  describe('GET /book-a-visit/select-date-and-time', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken,
    ) as jest.Mocked<VisitSessionsService>

    beforeEach(() => {
      visitSessionsService.getVisitSessions.mockResolvedValue(slotsList)

      sessionApp = appWithAllRoutes({
        visitSessionsServiceOverride: visitSessionsService,
        systemTokenOverride: systemToken,
        sessionData: {
          visitSessionData,
        } as SessionData,
      })
    })

    it('should render the available sessions list with none selected', () => {
      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-restriction"]').text()).toBe('Open')
          expect($('[data-test="closed-visit-reason"]').length).toBe(0)
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('input[name="visit-date-and-time"]:checked').length).toBe(0)
          expect($('.govuk-accordion__section--expanded').length).toBe(0)

          expect($('label[for="1"]').text()).toContain('Prisoner has a visit')
          expect($('#1').attr('disabled')).toBe('disabled')

          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should render the available sessions list with closed visit reason (visitor)', () => {
      visitSessionData.visitRestriction = 'CLOSED'
      visitSessionData.closedVisitReason = 'visitor'

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-restriction"]').text()).toBe('Closed')
          expect($('[data-test="closed-visit-reason"]').text()).toContain(
            'Closed visit as a visitor has a closed visit restriction.',
          )
        })
    })

    it('should render the available sessions list with closed visit reason (prisoner)', () => {
      visitSessionData.visitRestriction = 'CLOSED'
      visitSessionData.closedVisitReason = 'prisoner'

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-restriction"]').text()).toBe('Closed')
          expect($('[data-test="closed-visit-reason"]').text()).toContain(
            'Closed visit as the prisoner has a closed visit restriction.',
          )
        })
    })

    it('should show message if no sessions are available', () => {
      visitSessionsService.getVisitSessions.mockResolvedValue({})

      sessionApp = appWithAllRoutes({
        visitSessionsServiceOverride: visitSessionsService,
        systemTokenOverride: systemToken,
        sessionData: {
          visitSessionData,
        } as SessionData,
      })

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('#main-content').text()).toContain('There are no available slots for the selected time and day.')
          expect($('input[name="visit-date-and-time"]').length).toBe(0)
          expect($('[data-test="submit"]').length).toBe(0)
          expect($('[data-test="back-to-start"]').length).toBe(1)
        })
    })

    it('should render the available sessions list with the slot in the session selected', () => {
      visitSessionData.visit = {
        id: '3',
        startTimestamp: '2022-02-14T12:00:00',
        endTimestamp: '2022-02-14T13:05:00',
        availableTables: 5,
        capacity: 30,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      }

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('.govuk-accordion__section--expanded').length).toBe(1)
          expect($('.govuk-accordion__section--expanded #3').length).toBe(1)
          expect($('input#3').prop('checked')).toBe(true)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should render validation errors from flash data for invalid input', () => {
      flashData.errors = [{ location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time' }]

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
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

  describe('POST /book-a-visit/select-date-and-time', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken,
    ) as jest.Mocked<VisitSessionsService>

    const reservedVisit: Partial<Visit> = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    beforeEach(() => {
      visitSessionsService.reserveVisit = jest.fn().mockResolvedValue(reservedVisit)
      visitSessionsService.updateVisit = jest.fn()

      sessionApp = appWithAllRoutes({
        visitSessionsServiceOverride: visitSessionsService,
        auditServiceOverride: auditService,
        systemTokenOverride: systemToken,
        sessionData: {
          slotsList,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should save to session, reserve visit and redirect to additional support page if slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=2')
        .expect(302)
        .expect('location', '/book-a-visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual(<VisitSlot>{
            id: '2',
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            availableTables: 1,
            capacity: 30,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          })
          expect(visitSessionData.applicationReference).toEqual(reservedVisit.applicationReference)
          expect(visitSessionData.visitReference).toEqual(reservedVisit.reference)
          expect(visitSessionData.visitStatus).toEqual(reservedVisit.visitStatus)

          expect(visitSessionsService.reserveVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.updateVisit).not.toHaveBeenCalled()

          expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.reservedVisit).toHaveBeenCalledWith({
            visitReference: reservedVisit.reference,
            prisonerId: 'A1234BC',
            visitorIds: ['4323'],
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            visitRestriction: 'OPEN',
            username: undefined,
            operationId: undefined,
          })
        })
    })

    it('should save new choice to session, update visit reservation and redirect to additional support page if existing session data present', () => {
      visitSessionData.visit = {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        capacity: 30,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      }

      visitSessionData.applicationReference = reservedVisit.applicationReference
      visitSessionData.visitReference = reservedVisit.reference
      visitSessionData.visitStatus = reservedVisit.visitStatus

      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=3')
        .expect(302)
        .expect('location', '/book-a-visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual(<VisitSlot>{
            id: '3',
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
          expect(visitSessionData.visitStatus).toEqual(reservedVisit.visitStatus)

          expect(visitSessionsService.reserveVisit).not.toHaveBeenCalled()
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.updateVisit.mock.calls[0][0].visitData.visitReference).toBe(
            reservedVisit.reference,
          )

          expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.reservedVisit).toHaveBeenCalledWith({
            visitReference: reservedVisit.reference,
            prisonerId: 'A1234BC',
            visitorIds: ['4323'],
            startTimestamp: '2022-02-14T12:00:00',
            endTimestamp: '2022-02-14T13:05:00',
            visitRestriction: 'OPEN',
            username: undefined,
            operationId: undefined,
          })
        })
    })

    it('should should set validation errors in flash and redirect if no slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
          expect(auditService.reservedVisit).not.toHaveBeenCalled()
        })
    })

    it('should should set validation errors in flash and redirect, preserving filter settings, if no slot selected', () => {
      sessionApp = appWithAllRoutes({
        auditServiceOverride: auditService,
        systemTokenOverride: systemToken,
        sessionData: {
          timeOfDay: 'afternoon',
          dayOfTheWeek: '3',
          slotsList,
          visitSessionData,
        } as SessionData,
      })

      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time?timeOfDay=afternoon&dayOfTheWeek=3')
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
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=100')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time')
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
