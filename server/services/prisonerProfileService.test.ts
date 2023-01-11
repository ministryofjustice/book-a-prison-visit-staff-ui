import { NotFound } from 'http-errors'
import PrisonerProfileService from './prisonerProfileService'
import PrisonApiClient from '../data/prisonApiClient'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import {
  Alert,
  InmateDetail,
  PagePrisonerBookingSummary,
  VisitBalances,
  OffenderRestrictions,
} from '../data/prisonApiTypes'
import { PrisonerAlertItem } from '../@types/bapv'
import { Visit } from '../data/visitSchedulerApiTypes'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import SupportedPrisonsService from './supportedPrisonsService'
import { createInmateDetail, createSupportedPrisons } from '../data/__testutils/testObjects'

jest.mock('../data/prisonApiClient')
jest.mock('../data/visitSchedulerApiClient')
jest.mock('../data/prisonerContactRegistryApiClient')
jest.mock('./supportedPrisonsService')

const offenderNo = 'A1234BC'
const prisonId = 'HEI'
const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>
const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(
  null,
) as jest.Mocked<PrisonerContactRegistryApiClient>
const supportedPrisonsService = new SupportedPrisonsService(null, null, null) as jest.Mocked<SupportedPrisonsService>

describe('Prisoner profile service', () => {
  let prisonApiClientBuilder
  let visitSchedulerApiClientBuilder
  let prisonerContactRegistryApiClientBuilder
  let prisonerProfileService: PrisonerProfileService
  let systemToken

  beforeEach(() => {
    systemToken = async (user: string): Promise<string> => `${user}-token-1`
    prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
    visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
    prisonerContactRegistryApiClientBuilder = jest.fn().mockReturnValue(prisonerContactRegistryApiClient)
    prisonerProfileService = new PrisonerProfileService(
      prisonApiClientBuilder,
      visitSchedulerApiClientBuilder,
      prisonerContactRegistryApiClientBuilder,
      supportedPrisonsService,
      systemToken,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getProfile', () => {
    const supportedPrisons = createSupportedPrisons()

    beforeEach(() => {
      supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
    })

    it('Retrieves and processes data for prisoner profile with visit balances', async () => {
      const bookings = <PagePrisonerBookingSummary>{
        content: [
          {
            bookingId: 12345,
            bookingNo: 'A123445',
            offenderNo: 'A1234BC',
            firstName: 'JOHN',
            lastName: 'SMITH',
            dateOfBirth: '1980-10-12',
            agencyId: 'HEI',
            legalStatus: 'SENTENCED',
            convictedStatus: 'Convicted',
          },
        ],
        numberOfElements: 1,
      }

      const inmateDetail = createInmateDetail()

      const visitBalances: VisitBalances = {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      }

      const visit: Visit = {
        applicationReference: 'aaa-bbb-ccc',
        reference: 'ab-cd-ef-gh',
        prisonerId: 'A1234BC',
        prisonId: 'HEI',
        visitRoom: 'A1 L3',
        visitType: 'SOCIAL',
        visitStatus: 'BOOKED',
        visitRestriction: 'OPEN',
        startTimestamp: '2022-08-17T10:00:00',
        endTimestamp: '2022-08-17T11:00:00',
        visitNotes: [],
        visitors: [
          {
            nomisPersonId: 1234,
          },
        ],
        visitorSupport: [],
        createdTimestamp: '',
        modifiedTimestamp: '',
      }

      const socialContacts: Contact[] = [
        {
          personId: 1234,
          firstName: 'Mary',
          lastName: 'Smith',
          relationshipCode: 'PART',
          relationshipDescription: 'Partner',
          contactType: 'S',
          contactTypeDescription: 'Social/ Family',
          approvedVisitor: true,
          emergencyContact: true,
          nextOfKin: true,
          restrictions: [],
          addresses: [],
        },
      ]

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      prisonApiClient.getVisitBalances.mockResolvedValue(visitBalances)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([visit])
      visitSchedulerApiClient.getPastVisits.mockResolvedValue([visit])
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(socialContacts)

      const results = await prisonerProfileService.getProfile(offenderNo, prisonId, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).toHaveBeenCalledTimes(1)
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)

      expect(results).toEqual({
        displayName: 'Smith, John',
        displayDob: '12 October 1980',
        activeAlerts: [],
        flaggedAlerts: [],
        inmateDetail,
        convictedStatus: 'Convicted',
        visitBalances,
        upcomingVisits: [
          [
            {
              html: "<a href='/visit/ab-cd-ef-gh'>ab-cd-ef-gh</a>",
              attributes: { 'data-test': 'tab-upcoming-reference' },
            },
            { html: 'Social', attributes: { 'data-test': 'tab-upcoming-type' } },
            { text: 'Hewell (HMP)', attributes: { 'data-test': 'tab-upcoming-location' } },
            {
              html: '<p>17 August 2022<br>10:00am - 11:00am</p>',
              attributes: { 'data-test': 'tab-upcoming-date-and-time' },
            },
            { html: '<p>Mary Smith</p>', attributes: { 'data-test': 'tab-upcoming-visitors' } },
            { text: 'Booked', attributes: { 'data-test': 'tab-upcoming-status' } },
          ],
        ],
        pastVisits: [
          [
            {
              html: "<a href='/visit/ab-cd-ef-gh'>ab-cd-ef-gh</a>",
              attributes: { 'data-test': 'tab-past-reference' },
            },
            { html: 'Social', attributes: { 'data-test': 'tab-past-type' } },
            { text: 'Hewell (HMP)', attributes: { 'data-test': 'tab-past-location' } },
            {
              html: '<p>17 August 2022<br>10:00am - 11:00am</p>',
              attributes: { 'data-test': 'tab-past-date-and-time' },
            },
            { html: '<p>Mary Smith</p>', attributes: { 'data-test': 'tab-past-visitors' } },
            { text: 'Booked', attributes: { 'data-test': 'tab-past-status' } },
          ],
        ],
      })
    })

    it('Does not look up visit balances for those on REMAND', async () => {
      const inmateDetail = createInmateDetail({ legalStatus: 'REMAND' })

      const bookings = <PagePrisonerBookingSummary>{
        content: [
          {
            bookingId: 22345,
            bookingNo: 'B123445',
            offenderNo: inmateDetail.offenderNo,
            firstName: inmateDetail.firstName,
            lastName: inmateDetail.lastName,
            dateOfBirth: inmateDetail.dateOfBirth,
            agencyId: 'HEI',
            legalStatus: 'REMAND',
            convictedStatus: 'Remand',
          },
        ],
        numberOfElements: 1,
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([])
      visitSchedulerApiClient.getPastVisits.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(offenderNo, prisonId, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).not.toHaveBeenCalled()
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(results).toEqual({
        displayName: 'Smith, John',
        displayDob: '12 October 1980',
        activeAlerts: [],
        flaggedAlerts: [],
        inmateDetail,
        convictedStatus: 'Remand',
        visitBalances: null,
        upcomingVisits: [],
        pastVisits: [],
      })
    })

    it('Filters active alerts that should be flagged', async () => {
      const inactiveAlert: Alert = {
        alertId: 1,
        alertType: 'R',
        alertTypeDescription: 'Risk',
        bookingId: 1234,
        alertCode: 'RCON',
        alertCodeDescription: 'Conflict with other prisoners',
        comment: 'Test',
        dateCreated: '2021-07-27',
        dateExpires: '2021-08-10',
        expired: true,
        active: false,
        offenderNo: 'B2345CD',
      }

      const nonRelevantAlert: Alert = {
        alertId: 2,
        alertType: 'X',
        alertTypeDescription: 'Security',
        bookingId: 1234,
        alertCode: 'XR',
        alertCodeDescription: 'Racist',
        comment: 'Test',
        dateCreated: '2022-01-01',
        expired: false,
        active: true,
        offenderNo: 'B2345CD',
      }

      const alertsToFlag: Alert[] = [
        {
          alertId: 3,
          alertType: 'U',
          alertTypeDescription: 'COVID unit management',
          bookingId: 1234,
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
          comment: 'Test',
          dateCreated: '2022-01-02',
          expired: false,
          active: true,
          offenderNo: 'B2345CD',
        },
        {
          alertId: 4,
          alertType: 'R',
          alertTypeDescription: 'Risk',
          bookingId: 1234,
          alertCode: 'RCDR',
          alertCodeDescription: 'Quarantined – Communicable Disease Risk',
          comment: 'Test',
          dateCreated: '2022-01-03',
          expired: false,
          active: true,
          offenderNo: 'B2345CD',
        },
        {
          alertId: 5,
          alertType: 'U',
          alertTypeDescription: 'COVID unit management',
          bookingId: 1234,
          alertCode: 'URCU',
          alertCodeDescription: 'Reverse Cohorting Unit',
          comment: 'Test',
          dateCreated: '2022-01-04',
          expired: false,
          active: true,
          offenderNo: 'B2345CD',
        },
      ]

      const alertsForDisplay: PrisonerAlertItem[] = [
        [
          {
            text: 'Security (X)',
            attributes: {
              'data-test': 'tab-alerts-type-desc',
            },
          },
          {
            text: 'Racist (XR)',
            attributes: {
              'data-test': 'tab-alerts-code-desc',
            },
          },
          {
            text: 'Test',
            attributes: {
              'data-test': 'tab-alerts-comment',
            },
          },
          {
            html: '<span class="bapv-table_cell--nowrap">1 January</span> 2022',
            attributes: {
              'data-test': 'tab-alerts-created',
            },
          },
          {
            html: 'Not entered',
            attributes: {
              'data-test': 'tab-alerts-expires',
            },
          },
        ],
        [
          {
            text: 'COVID unit management (U)',
            attributes: {
              'data-test': 'tab-alerts-type-desc',
            },
          },
          {
            text: 'Protective Isolation Unit (UPIU)',
            attributes: {
              'data-test': 'tab-alerts-code-desc',
            },
          },
          {
            text: 'Test',
            attributes: {
              'data-test': 'tab-alerts-comment',
            },
          },
          {
            html: '<span class="bapv-table_cell--nowrap">2 January</span> 2022',
            attributes: {
              'data-test': 'tab-alerts-created',
            },
          },
          {
            html: 'Not entered',
            attributes: {
              'data-test': 'tab-alerts-expires',
            },
          },
        ],
        [
          {
            text: 'Risk (R)',
            attributes: {
              'data-test': 'tab-alerts-type-desc',
            },
          },
          {
            text: 'Quarantined – Communicable Disease Risk (RCDR)',
            attributes: {
              'data-test': 'tab-alerts-code-desc',
            },
          },
          {
            text: 'Test',
            attributes: {
              'data-test': 'tab-alerts-comment',
            },
          },
          {
            html: '<span class="bapv-table_cell--nowrap">3 January</span> 2022',
            attributes: {
              'data-test': 'tab-alerts-created',
            },
          },
          {
            html: 'Not entered',
            attributes: {
              'data-test': 'tab-alerts-expires',
            },
          },
        ],
        [
          {
            text: 'COVID unit management (U)',
            attributes: {
              'data-test': 'tab-alerts-type-desc',
            },
          },
          {
            text: 'Reverse Cohorting Unit (URCU)',
            attributes: {
              'data-test': 'tab-alerts-code-desc',
            },
          },
          {
            text: 'Test',
            attributes: {
              'data-test': 'tab-alerts-comment',
            },
          },
          {
            html: '<span class="bapv-table_cell--nowrap">4 January</span> 2022',
            attributes: {
              'data-test': 'tab-alerts-created',
            },
          },
          {
            html: 'Not entered',
            attributes: {
              'data-test': 'tab-alerts-expires',
            },
          },
        ],
      ]

      const bookings = <PagePrisonerBookingSummary>{
        content: [
          {
            bookingId: 22345,
            bookingNo: 'B123445',
            offenderNo: 'A1234BC',
            firstName: 'JOHN',
            lastName: 'SMITH',
            dateOfBirth: '1980-10-12',
            agencyId: 'HEI',
            legalStatus: 'REMAND',
            convictedStatus: 'Remand',
          },
        ],
        numberOfElements: 1,
      }
      const prisonerProfile = createInmateDetail()

      const inmateDetail = <InmateDetail>{
        offenderNo: prisonerProfile.offenderNo,
        firstName: prisonerProfile.firstName,
        lastName: prisonerProfile.lastName,
        dateOfBirth: prisonerProfile.dateOfBirth,
        activeAlertCount: 4,
        inactiveAlertCount: 1,
        legalStatus: 'REMAND',
        alerts: [inactiveAlert, nonRelevantAlert, ...alertsToFlag],
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([])
      visitSchedulerApiClient.getPastVisits.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(offenderNo, prisonId, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).not.toHaveBeenCalled()
      expect(prisonerContactRegistryApiClient.getPrisonerSocialContacts).toHaveBeenCalledTimes(1)
      expect(results).toEqual({
        displayName: 'Smith, John',
        displayDob: '12 October 1980',
        activeAlerts: alertsForDisplay,
        flaggedAlerts: alertsToFlag,
        inmateDetail,
        convictedStatus: 'Remand',
        visitBalances: null,
        upcomingVisits: [],
        pastVisits: [],
      })
    })

    it('Throws 404 if no bookings found for criteria', async () => {
      // e.g. offenderNo doesn't exist - or not at specified prisonId
      const bookings = <PagePrisonerBookingSummary>{
        content: [],
        numberOfElements: 0,
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)

      await expect(async () => {
        await prisonerProfileService.getProfile(offenderNo, prisonId, 'user')
      }).rejects.toBeInstanceOf(NotFound)
    })
  })

  describe('getPrisonerAndVisitBalances', () => {
    const bookings = <PagePrisonerBookingSummary>{
      content: [
        {
          bookingId: 12345,
          bookingNo: 'A123445',
          offenderNo: 'A1234BC',
          firstName: 'JOHN',
          lastName: 'SMITH',
          dateOfBirth: '1980-10-12',
          agencyId: 'HEI',
          legalStatus: 'SENTENCED',
          convictedStatus: 'Convicted',
        },
      ],
      numberOfElements: 1,
    }

    const inmateDetail = createInmateDetail()

    const visitBalances: VisitBalances = {
      remainingVo: 1,
      remainingPvo: 2,
      latestIepAdjustDate: '2021-04-21',
      latestPrivIepAdjustDate: '2021-12-01',
    }

    beforeEach(() => {
      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      prisonApiClient.getVisitBalances.mockResolvedValue(visitBalances)
    })

    it('Retrieves prisoner details and visit balances for a Convicted prisoner', async () => {
      const results = await prisonerProfileService.getPrisonerAndVisitBalances(offenderNo, prisonId, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).toHaveBeenCalledTimes(1)
      expect(results).toEqual({ inmateDetail, visitBalances })
    })

    it('Retrieves prisoner details and no visit balances for prisoner on Remand', async () => {
      bookings.content[0].convictedStatus = 'Remand'

      const results = await prisonerProfileService.getPrisonerAndVisitBalances(offenderNo, prisonId, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).toHaveBeenCalledTimes(0)
      expect(results).toEqual({ inmateDetail, visitBalances: undefined })
    })
  })

  describe('getRestrictions', () => {
    it('Retrieves and passes through the offender restrictions', async () => {
      const restrictions = <OffenderRestrictions>{
        bookingId: 12345,
        offenderRestrictions: [
          {
            restrictionId: 0,
            comment: 'string',
            restrictionType: 'string',
            restrictionTypeDescription: 'string',
            startDate: '2022-03-15',
            expiryDate: '2022-03-15',
            active: true,
          },
        ],
      }

      prisonApiClient.getOffenderRestrictions.mockResolvedValue(restrictions)

      const results = await prisonerProfileService.getRestrictions(offenderNo, 'user')

      expect(prisonApiClient.getOffenderRestrictions).toHaveBeenCalledTimes(1)
      expect(results).toEqual([
        {
          restrictionId: 0,
          comment: 'string',
          restrictionType: 'string',
          restrictionTypeDescription: 'string',
          startDate: '2022-03-15',
          expiryDate: '2022-03-15',
          active: true,
        },
      ])
    })
  })
})
