import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { OutcomeDto, Visit } from '../data/visitSchedulerApiTypes'
import { VisitorListItem, VisitSessionData } from '../@types/bapv'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import config from '../config'
import NotificationsService from '../services/notificationsService'
import { clearSession } from './visitorUtils'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')
jest.mock('../services/prisonerVisitorsService')
jest.mock('../services/prisonerProfileService')
jest.mock('../services/supportedPrisonsService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
let flashData: Record<string, string[] | Record<string, string>[]>
let visitSessionData: VisitSessionData

const prisonerSearchService = new PrisonerSearchService(null, systemToken) as jest.Mocked<PrisonerSearchService>
const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<VisitSessionsService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const prisonerVisitorsService = new PrisonerVisitorsService(null, systemToken) as jest.Mocked<PrisonerVisitorsService>
const supportedPrisonsService = new SupportedPrisonsService(
  null,
  null,
  systemToken,
) as jest.Mocked<SupportedPrisonsService>

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
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    prisonerSearchServiceOverride: prisonerSearchService,
    visitSessionsServiceOverride: visitSessionsService,
    auditServiceOverride: auditService,
    prisonerVisitorsServiceOverride: prisonerVisitorsService,
    systemTokenOverride: systemToken,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/:reference', () => {
  const childBirthYear = new Date().getFullYear() - 5

  const prisoner: Prisoner = {
    firstName: 'JOHN',
    lastName: 'SMITH',
    prisonerNumber: 'A1234BC',
    dateOfBirth: '1975-04-02',
    prisonId: 'HEI',
    prisonName: 'Hewell (HMP)',
    cellLocation: '1-1-C-028',
    restrictedPatient: false,
  }

  let visit: Visit

  const visitors: VisitorListItem[] = [
    {
      personId: 4321,
      name: 'Jeanette Smith',
      dateOfBirth: '1986-07-28',
      adult: true,
      relationshipDescription: 'Sister',
      address: '123 The Street,<br>Coventry',
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
      personId: 4324,
      name: 'Anne Smith',
      dateOfBirth: `${childBirthYear}-01-02`,
      adult: false,
      relationshipDescription: 'Niece',
      address: 'Not entered',
      restrictions: [],
      banned: false,
    },
  ]

  const additionalSupport = ['Wheelchair ramp', 'custom request']

  beforeEach(() => {
    visit = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'visit room',
      visitType: 'SOCIAL',
      visitStatus: 'BOOKED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-09T10:00:00',
      endTimestamp: '2022-02-09T11:15:00',
      visitNotes: [
        {
          type: 'VISIT_COMMENT',
          text: 'Example of a visit comment',
        },
        {
          type: 'VISITOR_CONCERN',
          text: 'Example of a visitor concern',
        },
      ],
      visitContact: {
        name: 'Jeanette Smith',
        telephone: '01234 567890',
      },
      visitors: [
        {
          nomisPersonId: 4321,
        },
        {
          nomisPersonId: 4324,
        },
      ],
      visitorSupport: [
        {
          type: 'WHEELCHAIR',
        },
        {
          type: 'OTHER',
          text: 'custom request',
        },
      ],
      createdTimestamp: '2022-02-14T10:00:00',
      modifiedTimestamp: '2022-02-14T10:05:00',
    }

    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ doNotFake: ['nextTick'], now: fakeDate })

    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitSessionsService.getFullVisitDetails.mockResolvedValue({ visit, visitors, additionalSupport })
    prisonerVisitorsService.getVisitors.mockResolvedValue(visitors)
    supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(['HEI'])

    visitSessionData = { prisoner: undefined }

    app = appWithAllRoutes({
      prisonerSearchServiceOverride: prisonerSearchService,
      visitSessionsServiceOverride: visitSessionsService,
      auditServiceOverride: auditService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
      // sessionData: {
      // visitSessionData,
      // } as SessionData,
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should render full booking summary page with prisoner, visit and visitor details, with default back link', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Booking details')
        expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
        expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
        // prisoner details
        expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
        expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
        // visit details
        expect($('[data-test="visit-date"]').text()).toBe('9 February 2022')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11:15am')
        expect($('[data-test="visit-type"]').text()).toBe('Open')
        expect($('[data-test="visit-contact"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visit-phone"]').text()).toBe('01234 567890')
        expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
        expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toContain('28 July 1986')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toContain(`2 January ${childBirthYear}`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should render full booking summary page with prisoner, visit and visitor details, with default back link, formatting unknown contact telephone correctly', () => {
    const unknownTelephoneVisit = JSON.parse(JSON.stringify(visit))
    unknownTelephoneVisit.visitContact.telephone = 'UNKNOWN'
    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitSessionsService.getFullVisitDetails.mockResolvedValue({
      visit: unknownTelephoneVisit,
      visitors,
      additionalSupport,
    })

    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Booking details')
        expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
        expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
        // prisoner details
        expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
        expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
        // visit details
        expect($('[data-test="visit-date"]').text()).toBe('9 February 2022')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11:15am')
        expect($('[data-test="visit-type"]').text()).toBe('Open')
        expect($('[data-test="visit-contact"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visit-phone"]').text()).toBe('Unknown')
        expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
        expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toContain('28 July 1986')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toContain(`2 January ${childBirthYear}`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should render full booking summary page with prisoner, visit and visitor details with search back link when from visits', () => {
    const url =
      '/visit/ab-cd-ef-gh?query=startDate%3D2022-05-24%26type%3DOPEN%26time%3D3pm%2Bto%2B3%253A59pm&from=visit-search'

    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitSessionsService.getFullVisitDetails.mockResolvedValue({ visit, visitors, additionalSupport })

    return request(app)
      .get(url)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Booking details')
        expect($('.govuk-back-link').attr('href')).toBe('/visits?startDate=2022-05-24&type=OPEN&time=3pm+to+3%3A59pm')
        expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
        // prisoner details
        expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
        expect($('[data-test="prisoner-location"]').text()).toBe('1-1-C-028, Hewell (HMP)')
        // visit details
        expect($('[data-test="visit-date"]').text()).toBe('9 February 2022')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11:15am')
        expect($('[data-test="visit-type"]').text()).toBe('Open')
        expect($('[data-test="visit-contact"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visit-phone"]').text()).toBe('01234 567890')
        expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
        expect($('form').attr('action')).toBe('/visit/ab-cd-ef-gh')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toContain('28 July 1986')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toContain(`2 January ${childBirthYear}`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'A1234BC',
          prisonId: 'HEI',
          username: 'user1',
          operationId: undefined,
        })
      })
  })

  it('should render full booking summary page with prisoner location showing as "Unknown" if not a supported prison', () => {
    const transferPrisoner: Prisoner = {
      firstName: 'JOHN',
      lastName: 'SMITH',
      prisonerNumber: 'A1234BC',
      dateOfBirth: '1975-04-02',
      prisonId: 'TRN',
      prisonName: 'Transfer',
      restrictedPatient: false,
    }

    prisonerSearchService.getPrisonerById.mockResolvedValue(transferPrisoner)

    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Booking details')
        expect($('.govuk-back-link').attr('href')).toBe('/prisoner/A1234BC/visits')
        expect($('[data-test="reference"]').text()).toBe('ab-cd-ef-gh')
        // prisoner details
        expect($('[data-test="prisoner-name"]').text()).toBe('Smith, John')
        expect($('[data-test="prisoner-number"]').text()).toBe('A1234BC')
        expect($('[data-test="prisoner-dob"]').text()).toBe('2 April 1975')
        expect($('[data-test="prisoner-location"]').text()).toBe('Unknown')
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

  it('should not display update and cancel buttons if visit is cancelled', () => {
    visit.visitStatus = 'CANCELLED'
    visit.outcomeStatus = 'ADMINISTRATIVE_CANCELLATION'
    visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'booking error' }]
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancel-visit"]').length).toBe(0)
        expect($('[data-test="update-visit"]').length).toBe(0)
      })
  })

  it('should not display update and cancel buttons if start date has passed', () => {
    const visitDate = new Date(visit.startTimestamp)
    const testDate = visitDate.setFullYear(visitDate.getFullYear() + 1)
    jest.useFakeTimers({ advanceTimers: true, now: testDate })
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancel-visit"]').length).toBe(0)
        expect($('[data-test="update-visit"]').length).toBe(0)
      })
  })

  it('should display cancelled message - administrative', () => {
    visit.visitStatus = 'CANCELLED'
    visit.outcomeStatus = 'ADMINISTRATIVE_CANCELLATION'
    visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'booking error' }]
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancelled-visit-reason"]').text()).toContain(
          'due to an administrative error with the booking',
        )
        expect($('[data-test="cancelled-visit-reason"]').text()).toContain('booking error')
      })
  })

  it('should display cancelled message - visitor cancelled', () => {
    visit.visitStatus = 'CANCELLED'
    visit.outcomeStatus = 'VISITOR_CANCELLED'
    visit.visitNotes = [{ type: 'VISIT_OUTCOMES', text: 'no longer required' }]
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancelled-visit-reason"]').text()).toContain('by the visitor')
        expect($('[data-test="cancelled-visit-reason"]').text()).toContain('no longer required')
      })
  })
})

describe('POST /visit/:reference', () => {
  const childBirthYear = new Date().getFullYear() - 5

  const prisoner: Prisoner = {
    firstName: 'JOHN',
    lastName: 'SMITH',
    prisonerNumber: 'A1234BC',
    dateOfBirth: '1975-04-02',
    prisonId: 'HEI',
    prisonName: 'Hewell (HMP)',
    cellLocation: '1-1-C-028',
    restrictedPatient: false,
  }

  let visit: Visit

  const visitors: VisitorListItem[] = [
    {
      personId: 4321,
      name: 'Jeanette Smith',
      dateOfBirth: '1986-07-28',
      adult: true,
      relationshipDescription: 'Sister',
      address: '123 The Street,<br>Coventry',
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
      personId: 4324,
      name: 'Anne Smith',
      dateOfBirth: `${childBirthYear}-01-02`,
      adult: false,
      relationshipDescription: 'Niece',
      address: 'Not entered',
      restrictions: [],
      banned: false,
    },
  ]

  const additionalSupport = ['Wheelchair ramp', 'custom request']

  beforeEach(() => {
    visit = {
      applicationReference: 'aaa-bbb-ccc',
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'visit room',
      visitType: 'SOCIAL',
      visitStatus: 'BOOKED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-02-09T10:00:00',
      endTimestamp: '2022-02-09T11:15:00',
      visitNotes: [
        {
          type: 'VISIT_COMMENT',
          text: 'Example of a visit comment',
        },
        {
          type: 'VISITOR_CONCERN',
          text: 'Example of a visitor concern',
        },
      ],
      visitContact: {
        name: 'Jeanette Smith',
        telephone: '01234 567890',
      },
      visitors: [
        {
          nomisPersonId: 4321,
        },
        {
          nomisPersonId: 4324,
        },
      ],
      visitorSupport: [
        {
          type: 'WHEELCHAIR',
        },
        {
          type: 'OTHER',
          text: 'custom request',
        },
      ],
      createdTimestamp: '2022-02-14T10:00:00',
      modifiedTimestamp: '2022-02-14T10:05:00',
    }

    const fakeDate = new Date('2022-01-01')
    jest.useFakeTimers({ doNotFake: ['nextTick'], now: fakeDate })

    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitSessionsService.getFullVisitDetails.mockResolvedValue({ visit, visitors, additionalSupport })
    prisonerVisitorsService.getVisitors.mockResolvedValue(visitors)
    supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(['HEI'])

    visitSessionData = { prisoner: undefined }

    app = appWithAllRoutes({
      prisonerSearchServiceOverride: prisonerSearchService,
      visitSessionsServiceOverride: visitSessionsService,
      auditServiceOverride: auditService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should set up sessionData and redirect to select visitors page', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/update/select-visitors')
      .expect(res => {
        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(visitSessionData).toEqual(<VisitSessionData>{
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '1975-04-02',
            location: '1-1-C-028, Hewell (HMP)',
          },
          visitSlot: {
            id: '',
            startTimestamp: '2022-02-09T10:00:00',
            endTimestamp: '2022-02-09T11:15:00',
            availableTables: 0,
            visitRoomName: 'visit room',
            visitRestriction: 'OPEN',
          },
          originalVisitSlot: {
            id: '',
            startTimestamp: '2022-02-09T10:00:00',
            endTimestamp: '2022-02-09T11:15:00',
            availableTables: 0,
            visitRoomName: 'visit room',
            visitRestriction: 'OPEN',
          },
          visitRestriction: 'OPEN',
          visitors: [
            {
              address: '123 The Street,<br>Coventry',
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
              dateOfBirth: '2017-01-02',
              name: 'Anne Smith',
              personId: 4324,
              relationshipDescription: 'Niece',
              restrictions: [],
            },
          ],
          visitorSupport: [{ type: 'WHEELCHAIR' }, { text: 'custom request', type: 'OTHER' }],
          mainContact: { phoneNumber: '01234 567890', contactName: 'Jeanette Smith' },
          applicationReference: undefined,
          visitReference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        })
      })
  })
})

describe('GET /visit/:reference/cancel', () => {
  it('should render the cancellation reasons page with all the reasons and none selected', () => {
    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')
        expect($('input[name="cancel"]').length).toBe(4)
        expect($('input[name="cancel"]:checked').length).toBe(0)
        expect($('[data-test="visitor_cancelled"]').attr('value')).toBe('VISITOR_CANCELLED')
        expect($('label[for="cancel"]').text().trim()).toBe('Visitor cancelled')
        expect($('[data-test="administrative_error"]').attr('value')).toBe('ADMINISTRATIVE_ERROR')
        expect($('label[for="cancel-4"]').text().trim()).toBe('Administrative error')
        expect($('[data-test="cancel-booking"]').length).toBe(1)
      })
  })

  it('should render the cancellation reasons page with no selection validation error', () => {
    flashData.errors = [
      {
        msg: 'No answer selected',
        param: 'cancel',
        location: 'body',
      },
    ]

    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')
        expect($('input[name="cancel"]').length).toBe(4)
        expect($('input[name="cancel"]:checked').length).toBe(0)
        expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should render the cancellation reasons page with no reason text validation error', () => {
    flashData.errors = [
      {
        value: '',
        msg: 'Enter a reason for the cancellation',
        param: 'reason_establishment_cancelled',
        location: 'body',
      },
    ]

    flashData.formValues = [{ cancel: 'ESTABLISHMENT_CANCELLED' }]

    return request(app)
      .get('/visit/ab-cd-ef-gh/cancel')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Why is this booking being cancelled?')
        expect($('input[name="cancel"]').length).toBe(4)
        expect($('[data-test="establishment_cancelled"]').prop('checked')).toBe(true)
        expect($('.govuk-error-summary__body').text()).toContain('Enter a reason for the cancellation')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /visit/:reference/cancel', () => {
  const notificationsService = new NotificationsService(null) as jest.Mocked<NotificationsService>

  const cancelledVisit: Visit = {
    applicationReference: 'aaa-bbb-ccc',
    reference: 'ab-cd-ef-gh',
    prisonerId: 'AF34567G',
    prisonId: 'HEI',
    visitRoom: 'A1 L3',
    visitType: 'SOCIAL',
    visitStatus: 'CANCELLED',
    visitRestriction: 'OPEN',
    startTimestamp: '2022-02-14T10:00:00',
    endTimestamp: '2022-02-14T11:00:00',
    visitNotes: [
      {
        type: 'VISIT_OUTCOMES',
        text: 'VISITOR_CANCELLED',
      },
      {
        type: 'STATUS_CHANGED_REASON',
        text: 'cancellation reason',
      },
    ],
    visitContact: {
      name: 'Jeanette Smith',
      telephone: '01234567890',
    },
    visitors: [
      {
        nomisPersonId: 1234,
      },
    ],
    visitorSupport: [],
    createdTimestamp: '2022-02-14T10:00:00',
    modifiedTimestamp: '2022-02-14T10:05:00',
  }

  beforeEach(() => {
    visitSessionsService.cancelVisit = jest.fn().mockResolvedValue(cancelledVisit)
    notificationsService.sendCancellationSms = jest.fn().mockResolvedValue({})

    app = appWithAllRoutes({
      prisonerSearchServiceOverride: prisonerSearchService,
      visitSessionsServiceOverride: visitSessionsService,
      auditServiceOverride: auditService,
      systemTokenOverride: systemToken,
      notificationsServiceOverride: notificationsService,
    })
  })

  it('should cancel visit, set flash values, redirect to confirmation page and send cancellation SMS if reason and text entered', () => {
    config.apis.notifications.enabled = true

    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .send('reason_prisoner_cancelled=illness')
      .expect(302)
      .expect('location', '/visit/cancelled')
      .expect(() => {
        expect(visitSessionsService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(visitSessionsService.cancelVisit).toHaveBeenCalledWith({
          username: 'user1',
          reference: 'ab-cd-ef-gh',
          outcome: <OutcomeDto>{
            outcomeStatus: 'PRISONER_CANCELLED',
            text: 'illness',
          },
        })
        expect(flashProvider).toHaveBeenCalledWith('startTimestamp', cancelledVisit.startTimestamp)
        expect(flashProvider).toHaveBeenCalledWith('endTimestamp', cancelledVisit.endTimestamp)
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledWith({
          visitReference: 'ab-cd-ef-gh',
          prisonerId: 'AF34567G',
          prisonId: 'HEI',
          reason: 'PRISONER_CANCELLED: illness',
          username: 'user1',
          operationId: undefined,
        })
        expect(notificationsService.sendCancellationSms).toHaveBeenCalledTimes(1)
        expect(notificationsService.sendCancellationSms).toHaveBeenCalledWith({
          phoneNumber: cancelledVisit.visitContact.telephone,
          visitSlot: cancelledVisit.startTimestamp,
          prisonName: 'Hewell (HMP)',
          prisonPhoneNumber: '01234443225',
        })
      })
  })

  it('should NOT send Cancellation SMS if notifications disabled', () => {
    config.apis.notifications.enabled = false

    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .send('reason_prisoner_cancelled=illness')
      .expect(302)
      .expect('location', '/visit/cancelled')
      .expect(() => {
        expect(visitSessionsService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(notificationsService.sendCancellationSms).not.toHaveBeenCalled()
      })
  })

  it('should handle SMS sending failure', () => {
    config.apis.notifications.enabled = true

    notificationsService.sendCancellationSms.mockRejectedValue({})

    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .send('reason_prisoner_cancelled=illness')
      .expect(302)
      .expect('location', '/visit/cancelled')
      .expect(() => {
        expect(visitSessionsService.cancelVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(notificationsService.sendCancellationSms).toHaveBeenCalledTimes(1)
      })
  })

  it('should set validation errors in flash and redirect if no reason selected', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'cancel', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })

  it('should set validation errors in flash and redirect if no reason text entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=PRISONER_CANCELLED')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Enter a reason for the cancellation',
            param: 'reason_prisoner_cancelled',
            value: undefined,
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { cancel: 'PRISONER_CANCELLED' })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })

  it('should set validation errors in flash and redirect if invalid data entered', () => {
    return request(app)
      .post('/visit/ab-cd-ef-gh/cancel')
      .send('cancel=INVALID_VALUE')
      .send('reason_prisoner_cancelled=illness')
      .expect(302)
      .expect('location', '/visit/ab-cd-ef-gh/cancel')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'cancel', value: 'INVALID_VALUE' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          cancel: 'INVALID_VALUE',
          reason_prisoner_cancelled: 'illness',
        })
        expect(auditService.cancelledVisit).not.toHaveBeenCalled()
      })
  })
})

describe('GET /visit/cancelled', () => {
  it('should render the booking cancelled page with details of the visit', () => {
    flashData.startTimestamp = ['2022-02-09T10:15:00']
    flashData.endTimestamp = ['2022-02-09T11:00:00']

    return request(app)
      .get('/visit/cancelled')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Booking cancelled')
        expect($('[data-test="visit-details"]').text().trim()).toBe('10:15am to 11am on Wednesday 9 February 2022')
        expect($('[data-test="go-to-start"]').length).toBe(1)

        expect(clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
