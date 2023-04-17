import { NotFound } from 'http-errors'
import PrisonerProfileService from './prisonerProfileService'
import { PagePrisonerBookingSummary, VisitBalances, OffenderRestrictions } from '../data/prisonApiTypes'
import { PrisonerAlertItem, PrisonerProfile } from '../@types/bapv'
import { PageVisitDto, Alert } from '../data/orchestrationApiTypes'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import TestData from '../routes/testutils/testData'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonApiClient,
  createMockPrisonerContactRegistryApiClient,
  createMockPrisonerSearchClient,
  createMockVisitSchedulerApiClient,
} from '../data/testutils/mocks'
import { createMockSupportedPrisonsService } from './testutils/mocks'

const token = 'some token'

describe('Prisoner profile service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonApiClient = createMockPrisonApiClient()
  const prisonerContactRegistryApiClient = createMockPrisonerContactRegistryApiClient()
  const prisonerSearchClient = createMockPrisonerSearchClient()
  const visitSchedulerApiClient = createMockVisitSchedulerApiClient()
  const supportedPrisonsService = createMockSupportedPrisonsService()

  let prisonerProfileService: PrisonerProfileService

  const OrchestrationApiClientFactory = jest.fn()
  const PrisonApiClientFactory = jest.fn()
  const PrisonerContactRegistryApiClientFactory = jest.fn()
  const PrisonerSearchClientFactory = jest.fn()
  const VisitSchedulerApiClientFactory = jest.fn()

  const prisonerId = 'A1234BC'
  const prisonId = 'HEI'

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    PrisonApiClientFactory.mockReturnValue(prisonApiClient)
    PrisonerContactRegistryApiClientFactory.mockReturnValue(prisonerContactRegistryApiClient)
    PrisonerSearchClientFactory.mockReturnValue(prisonerSearchClient)
    VisitSchedulerApiClientFactory.mockReturnValue(visitSchedulerApiClient)

    prisonerProfileService = new PrisonerProfileService(
      OrchestrationApiClientFactory,
      PrisonApiClientFactory,
      VisitSchedulerApiClientFactory,
      PrisonerContactRegistryApiClientFactory,
      PrisonerSearchClientFactory,
      supportedPrisonsService,
      hmppsAuthClient,
    )
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getProfile', () => {
    const supportedPrisons = TestData.supportedPrisons()

    beforeEach(() => {
      supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
    })

    it('Retrieves and processes data for prisoner profile with visit balances', async () => {
      const fullPrisoner = {
        prisonerId: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1975-04-02',
        cellLocation: '1-1-C-028',
        prisonName: 'Hewell (HMP)',
        category: 'Cat C',
        convictedStatus: 'Convicted',
        incentiveLevel: 'Standard',
        alerts: [],
        visitBalances: {
          remainingVo: 1,
          remainingPvo: 2,
          latestIepAdjustDate: '2021-04-21',
          latestPrivIepAdjustDate: '2021-12-01',
        },
        visits: [
          {
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
            visitContact: {
              name: 'Mary Smith',
              telephone: '01234 555444',
            },
            visitors: [
              {
                nomisPersonId: 1234,
              },
            ],
            visitorSupport: [],
            createdBy: 'user1',
            createdTimestamp: '',
            modifiedTimestamp: '',
          },
        ],
      }

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(fullPrisoner)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)
      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)

      expect(results).toEqual(<PrisonerProfile>{
        activeAlerts: [],
        activeAlertCount: 0,
        flaggedAlerts: [],
        visits: [
          [
            {
              html: "<a href='/visit/ab-cd-ef-gh'>ab-cd-ef-gh</a>",
              attributes: {
                'data-test': 'tab-upcoming-reference',
              },
            },
            {
              html: '<span>Social<br>(Open)</span>',
              attributes: {
                'data-test': 'tab-upcoming-type',
              },
            },
            { text: 'Hewell (HMP)', attributes: { 'data-test': 'tab-upcoming-location' } },
            {
              html: '<p>17 August 2022<br>10:00am - 11:00am</p>',
              attributes: { 'data-test': 'tab-upcoming-date-and-time' },
            },
            { html: '<p>Mary Smith</p>', attributes: { 'data-test': 'tab-upcoming-visitors' } },
            { text: 'Booked', attributes: { 'data-test': 'tab-upcoming-status' } },
          ],
        ],
        prisonerDetails: {
          offenderNo: 'A1234BC',
          name: 'Smith, John',
          dob: '2 April 1975',
          convictedStatus: 'Convicted',
          category: 'Cat C',
          location: '1-1-C-028',
          prisonName: 'Hewell (HMP)',
          incentiveLevel: 'Standard',
          visitBalances: {
            remainingVo: 1,
            remainingPvo: 2,
            latestIepAdjustDate: '2021-04-21',
            latestPrivIepAdjustDate: '2021-12-01',
          },
        },
      })
    })
    // Skipped - previously used endpoints were skipped if prisoner was on remand, this logic may wish be to included in the new endpoint
    it.skip('Does not return visit balances for those on REMAND', async () => {
      const fullPrisoner = {
        prisonerId: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1975-04-02',
        cellLocation: '1-1-C-028',
        prisonName: 'Hewell (HMP)',
        category: 'Cat C',
        convictedStatus: 'Remand',
        incentiveLevel: 'Standard',
        alerts: [],
        visitBalances: {
          remainingVo: 1,
          remainingPvo: 2,
          latestIepAdjustDate: '2021-04-21',
          latestPrivIepAdjustDate: '2021-12-01',
        },
        visits: [],
      }

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(fullPrisoner)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)
      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<PrisonerProfile>{
        activeAlerts: [],
        activeAlertCount: 0,
        flaggedAlerts: [],
        visits: [],
        prisonerDetails: {
          offenderNo: 'A1234BC',
          name: 'Smith, John',
          dob: '2 April 1975',
          convictedStatus: 'Convicted',
          category: 'Cat C',
          location: '1-1-C-028',
          prisonName: 'Hewell (HMP)',
          incentiveLevel: 'Standard',
          visitBalances: {},
        },
      })
    })

    it('Filters active alerts that should be flagged', async () => {
      const inactiveAlert: Alert = {
        alertType: 'R',
        alertTypeDescription: 'Risk',
        alertCode: 'RCON',
        alertCodeDescription: 'Conflict with other prisoners',
        comment: 'Test',
        dateCreated: '2021-07-27',
        dateExpires: '2021-08-10',
        expired: true,
        active: false,
      }

      const nonRelevantAlert: Alert = {
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XR',
        alertCodeDescription: 'Racist',
        comment: 'Test',
        dateCreated: '2022-01-01',
        expired: false,
        active: true,
      }

      const alertsToFlag: Alert[] = [
        {
          alertType: 'U',
          alertTypeDescription: 'COVID unit management',
          alertCode: 'UPIU',
          alertCodeDescription: 'Protective Isolation Unit',
          comment: 'Test',
          dateCreated: '2022-01-02',
          expired: false,
          active: true,
        },
        {
          alertType: 'R',
          alertTypeDescription: 'Risk',
          alertCode: 'RCDR',
          alertCodeDescription: 'Quarantined – Communicable Disease Risk',
          comment: 'Test',
          dateCreated: '2022-01-03',
          expired: false,
          active: true,
        },
        {
          alertType: 'U',
          alertTypeDescription: 'COVID unit management',
          alertCode: 'URCU',
          alertCodeDescription: 'Reverse Cohorting Unit',
          comment: 'Test',
          dateCreated: '2022-01-04',
          expired: false,
          active: true,
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
            classes: 'bapv-force-overflow',
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
            classes: 'bapv-force-overflow',
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
            classes: 'bapv-force-overflow',
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
            classes: 'bapv-force-overflow',
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

      const fullPrisoner = {
        prisonerId: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1975-04-02',
        cellLocation: '1-1-C-028',
        prisonName: 'Hewell (HMP)',
        category: 'Cat C',
        convictedStatus: 'Convicted',
        incentiveLevel: 'Standard',
        alerts: [],
        visitBalances: {
          remainingVo: 1,
          remainingPvo: 2,
          latestIepAdjustDate: '2021-04-21',
          latestPrivIepAdjustDate: '2021-12-01',
        },
        visits: [],
      }

      fullPrisoner.alerts = [inactiveAlert, nonRelevantAlert, ...alertsToFlag]

      const prisoner = TestData.prisoner()

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(fullPrisoner)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)
      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)

      expect(results).toEqual(<PrisonerProfile>{
        activeAlerts: alertsForDisplay,
        activeAlertCount: 4,
        flaggedAlerts: alertsToFlag,
        visits: [],
        prisonerDetails: {
          offenderNo: 'A1234BC',
          name: 'Smith, John',
          dob: '2 April 1975',
          convictedStatus: 'Convicted',
          category: 'Cat C',
          location: '1-1-C-028',
          prisonName: 'Hewell (HMP)',
          incentiveLevel: 'Standard',
          visitBalances: {
            remainingVo: 1,
            remainingPvo: 2,
            latestIepAdjustDate: '2021-04-21',
            latestPrivIepAdjustDate: '2021-12-01',
          },
        },
      })
    })

    it.skip('Throws 404 if no bookings found for criteria', async () => {
      // e.g. offenderNo doesn't exist - or not at specified prisonId
      const bookings = <PagePrisonerBookingSummary>{
        content: [],
        numberOfElements: 0,
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)

      await expect(async () => {
        await prisonerProfileService.getProfile(prisonerId, prisonId, 'user')
      }).rejects.toBeInstanceOf(NotFound)
    })
  })

  describe('getPrisonerAndVisitBalances', () => {
    const offenderNo = 'A1234BC'
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

    const inmateDetail = TestData.inmateDetail()

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
    const offenderNo = 'A1234BC'
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
