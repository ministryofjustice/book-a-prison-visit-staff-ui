import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'
import { VisitSessionData } from '../../@types/bapv'
import { clearSession } from '../visitorUtils'
import TestData from '../testutils/testData'
import { createMockVisitService } from '../../services/testutils/mocks'

let app: Express

const visitService = createMockVisitService()

let visitDetails: VisitBookingDetailsDto
let visitSessionData: VisitSessionData

jest.mock('../visitorUtils', () => {
  const visitorUtils = jest.requireActual('../visitorUtils')
  return {
    ...visitorUtils,
    clearSession: jest.fn((req: Express.Request) => {
      req.session.visitSessionData = visitSessionData as VisitSessionData
    }),
  }
})

beforeEach(() => {
  const fakeDate = new Date('2022-01-01')
  jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

  visitDetails = TestData.visitBookingDetailsDto()
  visitSessionData = {} as VisitSessionData
  visitService.getVisitDetailed.mockResolvedValue(visitDetails)
  visitService.getPublicBookerStatus.mockReturnValue(false)

  app = appWithAllRoutes({
    services: { visitService },
    sessionData: {
      visitSessionData,
    } as SessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Start a visit update journey', () => {
  describe('POST /visit/:reference', () => {
    it('should populate visitSessionData for update journey and redirect to select visitors page', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/update-a-visit/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitService.getVisitDetailed).toHaveBeenCalledWith({ username: 'user1', reference: 'ab-cd-ef-gh' })
          expect(visitSessionData).toStrictEqual(<VisitSessionData>{
            allowOverBooking: false,
            prisoner: {
              firstName: 'John',
              lastName: 'Smith',
              offenderNo: 'A1234BC',
              location: '1-1-C-028, Hewell (HMP)',
              alerts: visitDetails.prisoner.prisonerAlerts,
              restrictions: visitDetails.prisoner.prisonerRestrictions,
            },
            visitSlot: {
              id: '',
              sessionTemplateReference: 'v9d.7ed.7u',
              prisonId: 'HEI',
              startTimestamp: '2022-01-14T10:00:00',
              endTimestamp: '2022-01-14T11:00:00',
              availableTables: 0,
              capacity: undefined,
              visitRoom: 'Visit room 1',
              visitRestriction: 'OPEN',
            },
            originalVisitSlot: {
              id: '',
              sessionTemplateReference: 'v9d.7ed.7u',
              prisonId: 'HEI',
              startTimestamp: '2022-01-14T10:00:00',
              endTimestamp: '2022-01-14T11:00:00',
              availableTables: 0,
              capacity: undefined,
              visitRoom: 'Visit room 1',
              visitRestriction: 'OPEN',
            },
            visitRestriction: 'OPEN',
            visitorIds: [4321],
            visitorSupport: { description: 'Wheelchair ramp' },
            mainContact: {
              contactId: 4321,
              relationshipDescription: 'WIFE',
              phoneNumber: '01234 567890',
              email: 'visitor@example.com',
              contactName: 'Jeanette Smith',
            },
            visitReference: 'ab-cd-ef-gh',
            publicBooker: false,
          })
        })
    })

    it('should populate visitSessionData with no visitorSupport for update journey and redirect to select visitors page', () => {
      visitDetails.visitorSupport = undefined

      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/update-a-visit/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitorSupport).toStrictEqual(<VisitSessionData['visitorSupport']>{
            description: '',
          })
        })
    })

    it('should redirect to /visit/:reference if selected establishment does not match prison for which visit booked', () => {
      const otherPrison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, activeCaseLoadId: otherPrison.prisonId }),
        services: { visitService },
        sessionData: {
          selectedEstablishment: otherPrison,
        } as SessionData,
      })

      return request(app).post('/visit/ab-cd-ef-gh').expect(302).expect('location', '/visit/ab-cd-ef-gh')
    })

    // default visit is 13 days away so using 14 days for simplicity
    it('should redirect to /visit/:reference/confirm-update if visit is less days away than policy notice days', () => {
      app = appWithAllRoutes({
        services: {
          visitService,
        },
        sessionData: {
          selectedEstablishment: TestData.prison({ policyNoticeDaysMin: 14 }),
        } as SessionData,
      })

      return request(app).post('/visit/ab-cd-ef-gh').expect(302).expect('location', '/visit/ab-cd-ef-gh/confirm-update')
    })

    it('should render 400 Bad Request error for invalid visit reference', () => {
      return request(app)
        .post('/visit/12-34-56-78')
        .expect(400)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('BadRequestError: Bad Request')
        })
    })
  })
})
