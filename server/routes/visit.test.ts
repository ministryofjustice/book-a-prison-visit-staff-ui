import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { OutcomeDto, SupportType, Visit } from '../data/visitSchedulerApiTypes'
import { VisitorListItem, VisitSessionData, VisitSlotList } from '../@types/bapv'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import config from '../config'
import NotificationsService from '../services/notificationsService'
import { clearSession } from './visitorUtils'
import PrisonerProfileService from '../services/prisonerProfileService'
import { OffenderRestriction } from '../data/prisonApiTypes'
import { Restriction } from '../data/prisonerContactRegistryApiTypes'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')
jest.mock('../services/prisonerVisitorsService')
jest.mock('../services/prisonerProfileService')

let app: Express
let sessionApp: Express
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
const prisonerProfileService = new PrisonerProfileService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<PrisonerProfileService>

jest.mock('./visitorUtils', () => {
  const visitorUtils = jest.requireActual('./visitorUtils')
  return {
    ...visitorUtils,
    clearSession: jest.fn((req: Express.Request) => {
      req.session.visitSessionData = visitSessionData as VisitSessionData
    }),
  }
})

const availableSupportTypes: SupportType[] = [
  {
    type: 'WHEELCHAIR',
    description: 'Wheelchair ramp',
  },
  {
    type: 'INDUCTION_LOOP',
    description: 'Portable induction loop for people with hearing aids',
  },
  {
    type: 'BSL_INTERPRETER',
    description: 'British Sign Language (BSL) Interpreter',
  },
  {
    type: 'MASK_EXEMPT',
    description: 'Face covering exemption',
  },
  {
    type: 'OTHER',
    description: 'Other',
  },
]

beforeEach(() => {
  config.features.updateJourneyEnabled = true
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

  const visit: Visit = {
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
    prisonerSearchService.getPrisonerById.mockResolvedValue(prisoner)
    visitSessionsService.getFullVisitDetails.mockResolvedValue({ visit, visitors, additionalSupport })
    prisonerVisitorsService.getVisitors.mockResolvedValue(visitors)

    visitSessionData = { prisoner: undefined }

    app = appWithAllRoutes({
      prisonerSearchServiceOverride: prisonerSearchService,
      visitSessionsServiceOverride: visitSessionsService,
      auditServiceOverride: auditService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })
  it('should not display button block if visit status is cancelled/superseded', () => {
    visit.visitStatus = 'CANCELLED'
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancel-visit"]').attr('href')).toBe(undefined)
      })
  })
  it('should display button block if visit status is booked', () => {
    visit.visitStatus = 'BOOKED'
    return request(app)
      .get('/visit/ab-cd-ef-gh')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="cancel-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/cancel')
      })
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
        expect($('[data-test="update-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/update/select-visitors')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toBe('28 July 1986<br>(Adult)')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toBe(`2 January ${childBirthYear}<br>(Child)`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith(
          'ab-cd-ef-gh',
          'A1234BC',
          'HEI',
          undefined,
          undefined,
        )

        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(visitSessionData).toEqual({
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '1975-04-02',
            location: '1-1-C-028, Hewell (HMP)',
          },
          visit: {
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
          previousVisitReference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
        })
      })
  })

  it('should render full booking summary page with prisoner, visit and visitor details, with default back link, with no update button if feature disabled', () => {
    config.features.updateJourneyEnabled = false

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
        expect($('[data-test="update-visit"]').text()).toBeFalsy()
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toBe('28 July 1986<br>(Adult)')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toBe(`2 January ${childBirthYear}<br>(Child)`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith(
          'ab-cd-ef-gh',
          'A1234BC',
          'HEI',
          undefined,
          undefined,
        )

        expect(clearSession).toHaveBeenCalledTimes(1)
        expect(visitSessionData).toEqual({
          prisoner: {
            name: 'Smith, John',
            offenderNo: 'A1234BC',
            dateOfBirth: '1975-04-02',
            location: '1-1-C-028, Hewell (HMP)',
          },
          visit: {
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
          previousVisitReference: 'ab-cd-ef-gh',
          visitStatus: 'BOOKED',
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
        expect($('[data-test="update-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/update/select-visitors')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toBe('28 July 1986<br>(Adult)')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toBe(`2 January ${childBirthYear}<br>(Child)`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith(
          'ab-cd-ef-gh',
          'A1234BC',
          'HEI',
          undefined,
          undefined,
        )

        expect(clearSession).toHaveBeenCalledTimes(1)
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
        expect($('[data-test="update-visit"]').attr('href')).toBe('/visit/ab-cd-ef-gh/update/select-visitors')
        // visitor details
        expect($('[data-test="visitor-name-1"]').text()).toBe('Smith, Jeanette')
        expect($('[data-test="visitor-dob-1"]').html()).toBe('28 July 1986<br>(Adult)')
        expect($('[data-test="visitor-relationship-1"]').text()).toBe('Sister')
        expect($('[data-test="visitor-address-1"]').html()).toBe('123 The Street,<br>Coventry')
        expect($('[data-test="visitor-restrictions-1"] .visitor-restriction-badge--CLOSED').text()).toBe('Closed')
        expect($('[data-test="visitor-restrictions-1"]').text()).toContain('End date not entered')
        expect($('[data-test="visitor-name-2"]').text()).toBe('Smith, Anne')
        expect($('[data-test="visitor-dob-2"]').html()).toBe(`2 January ${childBirthYear}<br>(Child)`)
        expect($('[data-test="visitor-relationship-2"]').text()).toBe('Niece')
        expect($('[data-test="visitor-address-2"]').html()).toBe('Not entered')
        expect($('[data-test="visitor-restrictions-2"]').text()).toBe('None')
        // additional info
        expect($('[data-test="visit-comment"]').eq(0).text()).toBe('Example of a visit comment')
        expect($('[data-test="visitor-concern"]').eq(0).text()).toBe('Example of a visitor concern')
        expect($('[data-test="additional-support"]').text()).toBe('Wheelchair ramp, custom request')
        expect($('[data-test="visit-booked"]').text()).toBe('Monday 14 February 2022 at 10am')

        expect(auditService.viewedVisitDetails).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisitDetails).toHaveBeenCalledWith(
          'ab-cd-ef-gh',
          'A1234BC',
          'HEI',
          undefined,
          undefined,
        )

        expect(clearSession).toHaveBeenCalledTimes(1)
      })
  })

  // Temporarily hiding any locations other than Hewell pending more work on transfer/release (see VB-907, VB-952)
  it('should render full booking summary page with prisoner - but showing location as Unknown if not Hewell', () => {
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
})

describe('GET /visit/:reference/update/select-visitors', () => {
  const visitorList: { visitors: VisitorListItem[] } = { visitors: [] }
  const previousVisitReference = 'ab-cd-ef-gh'

  let returnData: VisitorListItem[]
  let restrictions: OffenderRestriction[]

  beforeAll(() => {
    returnData = [
      {
        personId: 4321,
        name: 'Jeanette Smith',
        dateOfBirth: '1986-07-28',
        adult: true,
        relationshipDescription: 'Sister',
        address:
          'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
        restrictions: [
          {
            restrictionType: 'BAN',
            restrictionTypeDescription: 'Banned',
            startDate: '2022-01-01',
            expiryDate: '2022-07-31',
            comment: 'Ban details',
          },
          {
            restrictionType: 'RESTRICTED',
            restrictionTypeDescription: 'Restricted',
            startDate: '2022-01-02',
          },
          {
            restrictionType: 'CLOSED',
            restrictionTypeDescription: 'Closed',
            startDate: '2022-01-03',
          },
          {
            restrictionType: 'NONCON',
            restrictionTypeDescription: 'Non-Contact Visit',
            startDate: '2022-01-04',
          },
        ] as Restriction[],
        banned: true,
      },
      {
        personId: 4322,
        name: 'Bob Smith',
        dateOfBirth: undefined,
        adult: undefined,
        relationshipDescription: 'Brother',
        address: '1st listed address',
        restrictions: [],
        banned: false,
      },
      {
        personId: 4324,
        name: 'Anne Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Niece',
        address: 'Not entered',
        restrictions: [],
        banned: false,
      },
    ]

    restrictions = [
      {
        restrictionId: 0,
        comment: 'string',
        restrictionType: 'BAN',
        restrictionTypeDescription: 'Banned',
        startDate: '2022-03-15',
        expiryDate: '2022-03-15',
        active: true,
      },
    ]
  })

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
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
      ],
      previousVisitReference,
    }

    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)
    prisonerProfileService.getRestrictions.mockResolvedValue(restrictions)

    sessionApp = appWithAllRoutes({
      prisonerProfileServiceOverride: prisonerProfileService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitorList,
        visitSessionData,
      } as SessionData,
    })
  })

  it('should render the prisoner restrictions when they are present', () => {
    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
        expect($('.test-restrictions-comment1').text().trim()).toBe('string')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('15 March 2022')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('15 March 2022')
        expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
      })
  })

  it('should render the prisoner restrictions when they are present, displaying a message if dates are not set', () => {
    restrictions = [
      {
        restrictionId: 0,
        comment: 'string',
        restrictionType: 'BAN',
        restrictionTypeDescription: 'Banned',
        startDate: '',
        expiryDate: '',
        active: true,
      },
    ]
    prisonerProfileService.getRestrictions.mockResolvedValue(restrictions)

    sessionApp = appWithAllRoutes({
      prisonerProfileServiceOverride: prisonerProfileService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitorList,
        visitSessionData,
      } as SessionData,
    })

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
        expect($('.test-restrictions-comment1').text().trim()).toBe('string')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('Not entered')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('Not entered')
        expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
      })
  })

  it('should display a message when there are no prisoner restrictions', () => {
    prisonerProfileService.getRestrictions.mockResolvedValue([])

    sessionApp = appWithAllRoutes({
      prisonerProfileServiceOverride: prisonerProfileService,
      prisonerVisitorsServiceOverride: prisonerVisitorsService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitorList,
        visitSessionData,
      } as SessionData,
    })

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-no-prisoner-restrictions').text()).toBe('')
        expect($('.test-restrictions-type1').text()).toBe('')
        expect($('.test-restrictions-comment1').text().trim()).toBe('')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('')
        expect(visitSessionData.prisoner.restrictions).toEqual([])
      })
  })

  it('should render the approved visitor list for offender number A1234BC with the original selected and store visitorList in session', () => {
    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')

        expect($('#visitor-4321').length).toBe(1)
        expect($('#visitor-4321').prop('disabled')).toBe(true)
        expect($('[data-test="visitor-name-4321"]').text()).toBe('Jeanette Smith')
        expect($('[data-test="visitor-dob-4321"]').text()).toMatch(/28 July 1986.*Adult/)
        expect($('[data-test="visitor-relation-4321"]').text()).toContain('Sister')
        expect($('[data-test="visitor-address-4321"]').text()).toContain('123 The Street')
        const visitorRestrictions = $('[data-test="visitor-restrictions-4321"] .visitor-restriction')
        expect(visitorRestrictions.eq(0).text()).toContain('Banned until 31 July 2022')
        expect(visitorRestrictions.eq(0).text()).toContain('Ban details')
        expect(visitorRestrictions.eq(1).text()).toContain('Restricted End date not entered')
        expect(visitorRestrictions.eq(2).text()).toContain('Closed End date not entered')
        expect(visitorRestrictions.eq(3).text()).toContain('Non-Contact Visit End date not entered')

        expect($('#visitor-4322').prop('disabled')).toBe(false)
        expect($('[data-test="visitor-name-4322"]').text()).toBe('Bob Smith')
        expect($('[data-test="visitor-restrictions-4322"]').text()).toBe('None')

        expect($('#visitor-4324').prop('disabled')).toBe(false)
        expect($('#visitor-4324').prop('checked')).toBe(true)
        expect($('[data-test="visitor-name-4324"]').text()).toBe('Anne Smith')
        expect($('[data-test="visitor-dob-4324"]').text()).toMatch(/2 March 2018.*Child/)

        expect($('input[name="visitors"]:checked').length).toBe(1)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')

        expect(visitorList.visitors).toEqual(returnData)
        expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
      })
  })

  it('should render the approved visitor list for offender number A1234BC with those in session (single) selected', () => {
    visitSessionData.visitors = [
      {
        address: '1st listed address',
        adult: undefined,
        dateOfBirth: undefined,
        name: 'Bob Smith',
        personId: 4322,
        relationshipDescription: 'Brother',
        restrictions: [],
        banned: false,
      },
    ]

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(3)
        expect($('#visitor-4321').prop('checked')).toBe(false)
        expect($('#visitor-4322').prop('checked')).toBe(true)
        expect($('#visitor-4324').prop('checked')).toBe(false)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')
      })
  })

  it('should render the approved visitor list for offender number A1234BC with those in session (multiple) selected', () => {
    visitSessionData.visitors = [
      {
        address: '1st listed address',
        adult: undefined,
        dateOfBirth: undefined,
        name: 'Bob Smith',
        personId: 4322,
        relationshipDescription: 'Brother',
        restrictions: [],
        banned: false,
      },
      {
        address: 'Not entered',
        adult: false,
        dateOfBirth: '2018-03-02',
        name: 'Anne Smith',
        personId: 4324,
        relationshipDescription: 'Niece',
        restrictions: [],
        banned: false,
      },
    ]

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(3)
        expect($('#visitor-4321').prop('checked')).toBe(false)
        expect($('#visitor-4322').prop('checked')).toBe(true)
        expect($('#visitor-4324').prop('checked')).toBe(true)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')
      })
  })

  it('should render validation errors from flash data for invalid input', () => {
    flashData.errors = [{ location: 'body', msg: 'No visitors selected', param: 'visitors', value: undefined }]

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('.govuk-error-summary__body').text()).toContain('No visitors selected')
        expect($('#visitors-error').text()).toContain('No visitors selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should show message and back to start button for prisoner with no approved visitors', () => {
    returnData = []
    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(0)
        expect($('#main-content').text()).toContain('There are no approved visitors for this prisoner.')
        expect($('[data-test="submit"]').length).toBe(0)
        expect($('[data-test="back-to-start"]').length).toBe(1)
      })
  })

  it('should show back to start rather than continue button if only child or banned visitors listed', () => {
    returnData = [
      {
        personId: 4322,
        name: 'Bob Smith',
        dateOfBirth: undefined,
        adult: undefined,
        relationshipDescription: 'Brother',
        address: '1st listed address',
        restrictions: [
          {
            restrictionType: 'BAN',
            restrictionTypeDescription: 'Banned',
            startDate: '2022-01-01',
          },
        ],
        banned: true,
      },
      {
        personId: 4324,
        name: 'Anne Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Niece',
        address: 'Not entered',
        restrictions: [],
        banned: false,
      },
    ]
    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

    return request(sessionApp)
      .get(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(2)
        expect($('[data-test="submit"]').length).toBe(0)
        expect($('[data-test="back-to-start"]').length).toBe(1)
      })
  })
})

describe('POST /visit/:reference/update/select-visitors', () => {
  const adultVisitors: { adults: VisitorListItem[] } = { adults: [] }
  const previousVisitReference = 'ab-cd-ef-gh'

  beforeEach(() => {
    const visitorList: { visitors: VisitorListItem[] } = {
      visitors: [
        {
          personId: 4321,
          name: 'Jeanette Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Sister',
          address:
            'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
          restrictions: [
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2022-07-31',
              comment: 'Ban details',
            },
          ],
          banned: true,
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
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
        {
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4325,
          name: 'Bill Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Nephew',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4326,
          name: 'John Jones',
          dateOfBirth: '1978-05-25',
          adult: true,
          relationshipDescription: 'Friend',
          address: 'Not entered',
          restrictions: [
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-01',
            },
          ],
          banned: false,
        },
      ],
    }

    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
        restrictions: [],
      },
      visitRestriction: 'OPEN',
      previousVisitReference,
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        adultVisitors,
        visitorList,
        visitSessionData,
      } as SessionData,
    })
  })

  it('should save to session and redirect to the select date and time page if an adult is selected (OPEN visit)', () => {
    const returnAdult: VisitorListItem[] = [
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
    ]

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('OPEN')
        expect(visitSessionData.closedVisitReason).toBe(undefined)
      })
  })

  it('should save to session and redirect to the select date and time page if an adult with CLOSED restriction is selected (CLOSED visit)', () => {
    const returnAdult: VisitorListItem[] = [
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
      {
        address: 'Not entered',
        adult: true,
        dateOfBirth: '1978-05-25',
        name: 'John Jones',
        personId: 4326,
        relationshipDescription: 'Friend',
        restrictions: [
          {
            restrictionType: 'CLOSED',
            restrictionTypeDescription: 'Closed',
            startDate: '2022-01-01',
          },
        ],
        banned: false,
      },
    ]

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322')
      .send('visitors=4326')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('CLOSED')
        expect(visitSessionData.closedVisitReason).toBe('visitor')
      })
  })

  it('should save to session and redirect to the select date and time page if prisoner and visitor both have CLOSED restriction (CLOSED visit)', () => {
    visitSessionData.prisoner.restrictions = [
      {
        restrictionId: 12345,
        restrictionType: 'CLOSED',
        restrictionTypeDescription: 'Closed',
        startDate: '2022-05-16',
        active: true,
      },
    ]

    const returnAdult: VisitorListItem[] = [
      {
        address: 'Not entered',
        adult: true,
        dateOfBirth: '1978-05-25',
        name: 'John Jones',
        personId: 4326,
        relationshipDescription: 'Friend',
        restrictions: [
          {
            restrictionType: 'CLOSED',
            restrictionTypeDescription: 'Closed',
            startDate: '2022-01-01',
          },
        ],
        banned: false,
      },
    ]

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4326')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('CLOSED')
        expect(visitSessionData.closedVisitReason).toBe('visitor')
      })
  })

  it('should save to session and redirect to open/closed visit choice if prisoner has CLOSED restriction and visitor not CLOSED', () => {
    visitSessionData.prisoner.restrictions = [
      {
        restrictionId: 12345,
        restrictionType: 'CLOSED',
        restrictionTypeDescription: 'Closed',
        startDate: '2022-05-16',
        active: true,
      },
    ]

    const returnAdult: VisitorListItem[] = [
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
    ]

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/visit-type`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('OPEN')
        expect(visitSessionData.closedVisitReason).toBe(undefined)
      })
  })

  it('should save to session and redirect to the select date and time page if an adult and a child are selected', () => {
    const returnAdult: VisitorListItem = {
      address: '1st listed address',
      adult: true,
      dateOfBirth: '1986-07-28',
      name: 'Bob Smith',
      personId: 4322,
      relationshipDescription: 'Brother',
      restrictions: [],
      banned: false,
    }

    const returnChild: VisitorListItem = {
      address: 'Not entered',
      adult: false,
      dateOfBirth: '2018-03-02',
      name: 'Anne Smith',
      personId: 4324,
      relationshipDescription: 'Niece',
      restrictions: [],
      banned: false,
    }

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322&visitors=4324')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual([returnAdult])
        expect(visitSessionData.visitors).toEqual([returnAdult, returnChild])
        expect(visitSessionData.visitRestriction).toBe('OPEN')
      })
  })

  it('should save new choice to session and redirect to select date and time page if existing session data present', () => {
    adultVisitors.adults = [
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
    ]

    visitSessionData.visitors = [
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
    ]

    const returnAdult: VisitorListItem = {
      personId: 4323,
      name: 'Ted Smith',
      dateOfBirth: '1968-07-28',
      adult: true,
      relationshipDescription: 'Father',
      address: '1st listed address',
      restrictions: [],
      banned: false,
    }

    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4323')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
      .expect(() => {
        expect(adultVisitors.adults).toEqual([returnAdult])
        expect(visitSessionData.visitors).toEqual([returnAdult])
        expect(visitSessionData.visitRestriction).toBe('OPEN')
      })
  })

  it('should should set validation errors in flash and redirect if invalid visitor selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=1234')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '1234' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '1234' })
      })
  })

  it('should should set validation errors in flash and redirect if banned is visitor selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4321')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Invalid selection', param: 'visitors', value: '4321' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4321' })
      })
  })

  it('should set validation errors in flash and redirect if no visitors are selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No visitors selected', param: 'visitors', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {})
      })
  })

  it('should set validation errors in flash and redirect if no adults are selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4324')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '4324' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4324' })
      })
  })

  it('should set validation errors in flash and redirect if more than 2 adults are selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322&visitors=4323&visitors=4326')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 2 adults',
            param: 'visitors',
            value: ['4322', '4323', '4326'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4322', '4323', '4326'] })
      })
  })

  it('should set validation errors in flash and redirect if more than 3 visitors are selected', () => {
    return request(sessionApp)
      .post(`/visit/${previousVisitReference}/update/select-visitors`)
      .send('visitors=4322&visitors=4323&visitors=4324&visitors=4325')
      .expect(302)
      .expect('location', `/visit/${previousVisitReference}/update/select-visitors`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 3 visitors with a maximum of 2 adults',
            param: 'visitors',
            value: ['4322', '4323', '4324', '4325'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4322', '4323', '4324', '4325'] })
      })
  })
})

describe('/visit/:reference/update/visit-type', () => {
  const previousVisitReference = 'ab-cd-ef-gh'

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
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
      previousVisitReference,
    }

    sessionApp = appWithAllRoutes({
      auditServiceOverride: auditService,
      systemTokenOverride: systemToken,
      sessionData: {
        visitSessionData,
      } as SessionData,
    })
  })

  describe('GET /visit/:reference/update/visit-type', () => {
    it('should render the open/closed visit type page with prisoner restrictions and visitor list', () => {
      return request(sessionApp)
        .get(`/visit/${previousVisitReference}/update/visit-type`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe("Check the prisoner's closed visit restrictions")
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
          param: 'visitType',
          location: 'body',
        },
      ]

      return request(sessionApp)
        .get(`/visit/${previousVisitReference}/update/visit-type`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe("Check the prisoner's closed visit restrictions")
          expect($('.govuk-error-summary__body').text()).toContain('No visit type selected')
          expect($('#visitType-error').text()).toContain('No visit type selected')
          expect($('[data-test="visit-type-open"]').prop('checked')).toBe(false)
          expect($('[data-test="visit-type-closed"]').prop('checked')).toBe(false)
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })
  })

  describe('POST /visit/:reference/update/visit-type', () => {
    it('should set validation errors in flash and redirect if visit type not selected', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/visit-type`)
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/visit-type`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No visit type selected', param: 'visitType', value: undefined },
          ])
        })
    })

    it('should set visit type to OPEN when selected and redirect to select date/time', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/visit-type`)
        .send('visitType=OPEN')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(() => {
          expect(visitSessionData.visitRestriction).toBe('OPEN')
          expect(visitSessionData.closedVisitReason).toBe(undefined)
          expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
          expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith(
            visitSessionData.prisoner.offenderNo,
            'OPEN',
            [visitSessionData.visitors[0].personId.toString()],
            undefined,
            undefined,
          )
        })
    })

    it('should set visit type to CLOSED when selected and redirect to select date/time', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/visit-type`)
        .send('visitType=CLOSED')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(() => {
          expect(visitSessionData.visitRestriction).toBe('CLOSED')
          expect(visitSessionData.closedVisitReason).toBe('prisoner')
          expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
          expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith(
            visitSessionData.prisoner.offenderNo,
            'CLOSED',
            [visitSessionData.visitors[0].personId.toString()],
            undefined,
            undefined,
          )
        })
    })
  })
})

describe('/visit/:reference/update/select-date-and-time', () => {
  const previousVisitReference = 'ab-cd-ef-gh'
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
      previousVisitReference,
    }
  })

  describe('GET /visit/:reference/update/select-date-and-time', () => {
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
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      }

      return request(sessionApp)
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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
        .get(`/visit/${previousVisitReference}/update/select-date-and-time`)
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

  describe.skip('POST /visit/:reference/update/select-date-and-time', () => {
    const createdVisit: Partial<Visit> = { reference: '2a-bc-3d-ef', visitStatus: 'RESERVED' }

    beforeEach(() => {
      visitSessionsService.reserveVisit = jest.fn().mockResolvedValue(createdVisit)
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

    it('should save to session, create visit and redirect to additional support page if slot selected', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .send('visit-date-and-time=2')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/additional-support`)
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '2',
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            availableTables: 1,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          })
          expect(visitSessionsService.reserveVisit).toHaveBeenCalledTimes(1)
          expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.reservedVisit).toHaveBeenCalledWith('2a-bc-3d-ef', 'A1234BC', 'HEI', undefined, undefined)
          expect(visitSessionsService.updateVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitReference).toEqual('2a-bc-3d-ef')
          expect(visitSessionData.visitStatus).toEqual('RESERVED')
        })
    })

    it('should save new choice to session, update visit reservation and redirect to additional support page if existing session data present', () => {
      visitSessionData.visit = {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        visitRoomName: 'room name',
        visitRestriction: 'OPEN',
      }

      visitSessionData.visitReference = '3b-cd-4f-fg'

      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .send('visit-date-and-time=3')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/additional-support`)
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '3',
            startTimestamp: '2022-02-14T12:00:00',
            endTimestamp: '2022-02-14T13:05:00',
            availableTables: 5,
            visitRoomName: 'room name',
            // representing the RESERVED visit being handled in this session
            sessionConflicts: ['DOUBLE_BOOKED'],
            visitRestriction: 'OPEN',
          })
          expect(visitSessionsService.reserveVisit).not.toHaveBeenCalled()
          expect(auditService.reservedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.reservedVisit).toHaveBeenCalledWith('3b-cd-4f-fg', 'A1234BC', 'HEI', undefined, undefined)
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.updateVisit.mock.calls[0][0].visitData.visitReference).toBe('3b-cd-4f-fg')
        })
    })

    it('should should set validation errors in flash and redirect if no slot selected', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
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
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(302)
        .expect(
          'location',
          `/visit/${previousVisitReference}/update/select-date-and-time?timeOfDay=afternoon&dayOfTheWeek=3`,
        )
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
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .send('visit-date-and-time=100')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '100' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '100' })
          expect(auditService.reservedVisit).not.toHaveBeenCalled()
        })
    })

    it('should should set validation errors in flash and redirect if fully booked slot selected', () => {
      return request(sessionApp)
        .post(`/visit/${previousVisitReference}/update/select-date-and-time`)
        .send('visit-date-and-time=5')
        .expect(302)
        .expect('location', `/visit/${previousVisitReference}/update/select-date-and-time`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '5' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '5' })
          expect(auditService.reservedVisit).not.toHaveBeenCalled()
        })
    })
  })
})

describe('/visit/:reference/update/check-your-booking', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
      visit: {
        id: 'visitId',
        startTimestamp: '2022-03-12T09:30:00',
        endTimestamp: '2022-03-12T10:30:00',
        availableTables: 1,
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
        phoneNumber: '0123 456 7890',
        contactName: 'abc',
      },
      visitReference: 'ab-cd-ef-gh',
      previousVisitReference: 'zy-xw-vu-ts',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes({
      systemTokenOverride: systemToken,
      sessionData: {
        availableSupportTypes,
        visitSessionData,
      } as SessionData,
    })
  })

  describe('GET /visit/{:reference}/update/check-your-booking', () => {
    it('should render all data from the session', () => {
      return request(sessionApp)
        .get(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('Wheelchair ramp')
          expect($('.test-additional-support').text()).toContain('Portable induction loop for people with hearing aids')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe(
            `/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`,
          )
        })
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      visitSessionData.visitorSupport = []

      return request(sessionApp)
        .get(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support').text()).toContain('None')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('0123 456 7890')
          expect($('form').prop('action')).toBe(
            `/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`,
          )
        })
    })
  })

  describe('POST /visit/{:reference}/update/check-your-booking', () => {
    const notificationsService = new NotificationsService(null) as jest.Mocked<NotificationsService>

    beforeEach(() => {
      const bookedVisit: Partial<Visit> = { reference: visitSessionData.visitReference, visitStatus: 'BOOKED' }

      visitSessionsService.updateVisit = jest.fn().mockResolvedValue(bookedVisit)
      notificationsService.sendBookingSms = jest.fn().mockResolvedValue({})

      sessionApp = appWithAllRoutes({
        auditServiceOverride: auditService,
        notificationsServiceOverride: notificationsService,
        visitSessionsServiceOverride: visitSessionsService,
        systemTokenOverride: systemToken,
        sessionData: {
          availableSupportTypes,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should book new visit, cancel previous one, record audit events, send SMS (notifications enabled) and redirect to confirmation page', () => {
      config.apis.notifications.enabled = true

      return request(sessionApp)
        .post(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(302)
        .expect('location', `/visit/${visitSessionData.previousVisitReference}/update/confirmation`)
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(auditService.bookedVisit).toHaveBeenCalledWith(
            visitSessionData.visitReference,
            visitSessionData.prisoner.offenderNo,
            'HEI',
            [visitSessionData.visitors[0].personId.toString()],
            '2022-03-12T09:30:00',
            '2022-03-12T10:30:00',
            'OPEN',
            undefined,
            undefined,
          )
          expect(visitSessionsService.cancelVisit).toHaveBeenCalledWith({
            username: undefined,
            reference: visitSessionData.previousVisitReference,
            outcome: <OutcomeDto>{
              outcomeStatus: 'SUPERSEDED_CANCELLATION',
              text: `Superseded by ${visitSessionData.visitReference}`,
            },
          })
          expect(auditService.cancelledVisit).toHaveBeenCalledWith(
            visitSessionData.previousVisitReference,
            visitSessionData.prisoner.offenderNo,
            'HEI',
            `SUPERSEDED_CANCELLATION: Superseded by ${visitSessionData.visitReference}`,
            undefined,
            undefined,
          )
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledWith({
            phoneNumber: '01234567890',
            visit: visitSessionData.visit,
            prisonName: 'Hewell (HMP)',
            reference: visitSessionData.visitReference,
          })
        })
    })

    it('should handle SMS sending failure', () => {
      config.apis.notifications.enabled = true

      notificationsService.sendBookingSms.mockRejectedValue({})

      return request(sessionApp)
        .post(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(302)
        .expect('location', `/visit/${visitSessionData.previousVisitReference}/update/confirmation`)
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).toHaveBeenCalledTimes(1)
          expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).toHaveBeenCalledTimes(1)
        })
    })

    it('should NOT send SMS if notifications disabled', () => {
      config.apis.notifications.enabled = false

      return request(sessionApp)
        .post(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(302)
        .expect('location', `/visit/${visitSessionData.previousVisitReference}/update/confirmation`)
        .expect(() => {
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitStatus).toBe('BOOKED')
          expect(auditService.bookedVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.cancelVisit).toHaveBeenCalledTimes(1)
          expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
        })
    })

    it('should handle booking failure, display error message and NOT record audit event nor send SMS', () => {
      config.apis.notifications.enabled = true

      visitSessionsService.updateVisit.mockRejectedValue({})

      return request(sessionApp)
        .post(`/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.govuk-error-summary__body').text()).toContain('Failed to make this reservation')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('form').prop('action')).toBe(
            `/visit/${visitSessionData.previousVisitReference}/update/check-your-booking`,
          )

          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionData.visitStatus).toBe('RESERVED')
          expect(auditService.bookedVisit).not.toHaveBeenCalled()
          expect(visitSessionsService.cancelVisit).not.toHaveBeenCalled()
          expect(auditService.cancelledVisit).not.toHaveBeenCalled()
          expect(notificationsService.sendBookingSms).not.toHaveBeenCalled()
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
          username: undefined,
          reference: 'ab-cd-ef-gh',
          outcome: <OutcomeDto>{
            outcomeStatus: 'PRISONER_CANCELLED',
            text: 'illness',
          },
        })
        expect(flashProvider).toHaveBeenCalledWith('startTimestamp', cancelledVisit.startTimestamp)
        expect(flashProvider).toHaveBeenCalledWith('endTimestamp', cancelledVisit.endTimestamp)
        expect(auditService.cancelledVisit).toHaveBeenCalledTimes(1)
        expect(auditService.cancelledVisit).toHaveBeenCalledWith(
          'ab-cd-ef-gh',
          'AF34567G',
          'HEI',
          'PRISONER_CANCELLED: illness',
          undefined,
          undefined,
        )
        expect(notificationsService.sendCancellationSms).toHaveBeenCalledTimes(1)
        expect(notificationsService.sendCancellationSms).toHaveBeenCalledWith({
          phoneNumber: cancelledVisit.visitContact.telephone,
          visit: cancelledVisit.startTimestamp,
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
