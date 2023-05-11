import { addMonths, format, subMonths } from 'date-fns'
import PrisonerProfileService from './prisonerProfileService'
import { OffenderRestrictions } from '../data/prisonApiTypes'
import { PrisonerAlertItem, PrisonerProfilePage } from '../@types/bapv'
import { Alert } from '../data/orchestrationApiTypes'
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
      PrisonerContactRegistryApiClientFactory,
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

    it('should retrieve and process data for prisoner profile (with visit balances)', async () => {
      const prisonerProfile = TestData.prisonerProfile()
      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const contacts = [TestData.contact(), TestData.contact({ personId: 4322, firstName: 'Bob' })]
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue(contacts)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)

      expect(results).toEqual(<PrisonerProfilePage>{
        activeAlerts: [],
        activeAlertCount: 0,
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
            remainingPvo: 2,
            latestIepAdjustDate: '21 April 2021',
            latestPrivIepAdjustDate: '1 December 2021',
            nextIepAdjustDate: '5 May 2021',
            nextPrivIepAdjustDate: '1 January 2022',
          },
        },
        contactNames: { 4321: 'Jeanette Smith', 4322: 'Bob Smith' },
      })
    })

    // Skipped - previously used endpoints were skipped if prisoner was on remand, this logic may wish be to included in the new endpoint
    it.skip('should not return visit balances for those on REMAND', async () => {
      const prisonerProfile = TestData.prisonerProfile({
        convictedStatus: 'Remand',
      })

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)
      expect(results).toEqual(<PrisonerProfilePage>{
        activeAlerts: [],
        activeAlertCount: 0,
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
          visitBalances: {},
        },
      })
    })

    it('should group upcoming and past visits by month, with totals for BOOKED only', async () => {
      const today = new Date()
      const nextMonth = new Date(addMonths(today, 1))
      const previousMonth = new Date(subMonths(today, 1))
      const nextMonthKey = format(nextMonth, 'MMMM yyyy')
      const previousMonthKey = format(previousMonth, 'MMMM yyyy')

      const visit1 = TestData.visit({ startTimestamp: nextMonth.toISOString() })
      const visit2 = TestData.visit({ startTimestamp: previousMonth.toISOString() })
      const visit3 = TestData.visit({ visitStatus: 'CANCELLED', startTimestamp: previousMonth.toISOString() })

      const prisonerProfile = TestData.prisonerProfile({
        visits: [visit1, visit2, visit3],
      })

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(results.visitsByMonth).toEqual(
        new Map([
          [nextMonthKey, { upcomingCount: 1, pastCount: 0, visits: [visit1] }],
          [previousMonthKey, { upcomingCount: 0, pastCount: 1, visits: [visit2, visit3] }],
        ]),
      )
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

      const prisonerProfile = TestData.prisonerProfile({
        alerts: [inactiveAlert, nonRelevantAlert, ...alertsToFlag],
      })

      prisonerProfile.alerts = [inactiveAlert, nonRelevantAlert, ...alertsToFlag]

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)
      prisonerContactRegistryApiClient.getPrisonerSocialContacts.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledTimes(1)

      expect(results.activeAlerts).toStrictEqual(alertsForDisplay)
      expect(results.activeAlertCount).toBe(4)
      expect(results.flaggedAlerts).toStrictEqual(alertsToFlag)
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
