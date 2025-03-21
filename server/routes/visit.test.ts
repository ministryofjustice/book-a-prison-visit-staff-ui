import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider, user } from './testutils/appSetup'
import { Visit, VisitHistoryDetails } from '../data/orchestrationApiTypes'
import { FlashData, PrisonerProfilePage, VisitorListItem, VisitSessionData } from '../@types/bapv'
import { clearSession } from './visitorUtils'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerProfileService,
  createMockPrisonerSearchService,
  createMockPrisonerVisitorsService,
  createMockSupportedPrisonsService,
  createMockVisitService,
  createMockVisitSessionsService,
} from '../services/testutils/mocks'

let app: Express

let flashData: FlashData

const auditService = createMockAuditService()
const prisonerProfileService = createMockPrisonerProfileService()
const prisonerSearchService = createMockPrisonerSearchService()
const prisonerVisitorsService = createMockPrisonerVisitorsService()
const supportedPrisonsService = createMockSupportedPrisonsService()
const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()

let visitSessionData: VisitSessionData

const prison = TestData.prison()
const supportedPrisonIds = TestData.supportedPrisonIds()

jest.mock('./visitorUtils', () => {
  const visitorUtils = jest.requireActual('./visitorUtils')
  return {
    ...visitorUtils,
    clearSession: jest.fn((req: Express.Request) => {
      req.session.visitSessionData = visitSessionData as VisitSessionData
    }),
  }
})

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerProfileService,
      prisonerSearchService,
      prisonerVisitorsService,
      visitSessionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/visit/:reference', () => {
  const childBirthYear = new Date().getFullYear() - 5

  const prisoner = TestData.prisoner()

  let visit: Visit
  let visitHistoryDetails: VisitHistoryDetails

  const visitors: VisitorListItem[] = [
    {
      personId: 4321,
      name: 'Jeanette Smith',
      dateOfBirth: '1986-07-28',
      adult: true,
      relationshipDescription: 'Sister',
      address: '123 The Street,\nCoventry',
      restrictions: [
        {
          restrictionType: 'CLOSED',
          restrictionTypeDescription: 'Closed',
          startDate: '2022-01-03',
          globalRestriction: false,
        },
      ],
      banned: false,
    },
    {
      personId: 4322,
      name: 'Anne Smith',
      dateOfBirth: `${childBirthYear}-01-02`,
      adult: false,
      relationshipDescription: 'Niece',
      address: 'Not entered',
      restrictions: [],
      banned: false,
    },
  ]

  const additionalSupport = 'Wheelchair ramp, Portable induction loop for people with hearing aids'

  beforeEach(() => {
    visit = TestData.visit()
    visitHistoryDetails = TestData.visitHistoryDetails({
      visit,
    })

    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })

    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitService.getFullVisitDetails.mockResolvedValue({
      visitHistoryDetails,
      visitors,
      additionalSupport,
    })
    prisonerVisitorsService.getVisitors.mockResolvedValue(visitors)
    supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
    supportedPrisonsService.getPrison.mockResolvedValue(prison)

    visitSessionData = { allowOverBooking: false, prisoner: undefined }

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerProfileService,
        prisonerSearchService,
        prisonerVisitorsService,
        supportedPrisonsService,
        visitService,
        visitSessionsService,
      },
      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('POST /visit/:reference', () => {
    const restriction = TestData.offenderRestriction()
    const alert = TestData.alert({
      alertType: 'X',
      alertTypeDescription: 'Security',
      alertCode: 'XR',
      alertCodeDescription: 'Racist',
      dateCreated: '2022-01-01',
      dateExpires: '2022-01-02',
    })
    beforeEach(() => {
      const prisonerProfile: PrisonerProfilePage = {
        alerts: [alert],
        flaggedAlerts: [],
        visitsByMonth: new Map(),
        prisonerDetails: {
          prisonerId: 'A1234BC',
          name: 'Smith, John',
          dateOfBirth: '2 April 1975',
          cellLocation: '1-1-C-028',
          prisonName: 'Hewell (HMP)',
          convictedStatus: 'Convicted',
          category: 'Cat C',
          incentiveLevel: 'Standard',
          visitBalances: {
            remainingVo: 1,
            remainingPvo: 0,
            latestIepAdjustDate: '21 April 2021',
            latestPrivIepAdjustDate: '1 December 2021',
            nextIepAdjustDate: '5 May 2021',
            nextPrivIepAdjustDate: '1 January 2022',
          },
        },
      }
      prisonerProfileService.getProfile.mockResolvedValue(prisonerProfile)
      prisonerProfileService.getRestrictions.mockResolvedValue([restriction])
    })

    it('should set up sessionData and redirect to select visitors page', () => {
      visit.applicationReference = undefined
      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
        .expect(res => {
          expect(clearSession).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getProfile).toHaveBeenCalledWith('HEI', 'A1234BC', 'user1')
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledTimes(1)
          expect(prisonerProfileService.getRestrictions).toHaveBeenCalledWith('A1234BC', 'user1')
          expect(visitSessionData).toStrictEqual(<VisitSessionData>{
            allowOverBooking: false,
            prisoner: {
              name: 'Smith, John',
              offenderNo: 'A1234BC',
              location: '1-1-C-028, HMP Hewell',
              alerts: [alert],
              restrictions: [restriction],
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
            visitors: [
              {
                address: '123 The Street,\nCoventry',
                adult: true,
                banned: false,
                dateOfBirth: '1986-07-28',
                name: 'Jeanette Smith',
                personId: 4321,
                relationshipDescription: 'Sister',
                restrictions: [
                  {
                    globalRestriction: false,
                    restrictionType: 'CLOSED',
                    restrictionTypeDescription: 'Closed',
                    startDate: '2022-01-03',
                  },
                ],
              },
              {
                address: 'Not entered',
                adult: false,
                banned: false,
                dateOfBirth: `${childBirthYear}-01-02`,
                name: 'Anne Smith',
                personId: 4322,
                relationshipDescription: 'Niece',
                restrictions: [],
              },
            ],
            visitorSupport: { description: 'Wheelchair ramp, Portable induction loop for people with hearing aids' },
            mainContact: {
              contact: visitors[0],
              phoneNumber: '01234 567890',
              email: 'visitor@example.com',
              contactName: 'Jeanette Smith',
            },
            visitReference: 'ab-cd-ef-gh',
          })
        })
    })

    it('should set up sessionData with no visitorSupport and redirect to select visitors page', () => {
      visit.applicationReference = undefined
      visit.visitorSupport = undefined

      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
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
        services: { auditService, supportedPrisonsService, visitService, visitSessionsService },
        sessionData: {
          selectedEstablishment: otherPrison,
        } as SessionData,
      })

      return request(app).post('/visit/ab-cd-ef-gh').expect(302).expect('location', '/visit/ab-cd-ef-gh')
    })

    // default visit is 13 days away so using 14 days for simplicity
    it('should redirect to /visit/:reference/update/confirm-update if visit is less days away than policy notice days', () => {
      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerProfileService,
          prisonerSearchService,
          prisonerVisitorsService,
          supportedPrisonsService,
          visitService,
          visitSessionsService,
        },
        sessionData: {
          selectedEstablishment: { ...prison, policyNoticeDaysMin: 14 },
        } as SessionData,
      })

      return request(app)
        .post('/visit/ab-cd-ef-gh')
        .expect(302)
        .expect('location', '/visit/ab-cd-ef-gh/update/confirm-update')
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
