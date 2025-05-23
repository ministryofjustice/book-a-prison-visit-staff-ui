import { addMonths, format, subMonths } from 'date-fns'
import PrisonerProfileService from './prisonerProfileService'
import { PrisonerProfilePage } from '../@types/bapv'
import TestData from '../routes/testutils/testData'
import {
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonerSearchClient,
} from '../data/testutils/mocks'

const token = 'some token'

describe('Prisoner profile service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonerSearchClient = createMockPrisonerSearchClient()

  let prisonerProfileService: PrisonerProfileService

  const OrchestrationApiClientFactory = jest.fn()
  const PrisonerSearchClientFactory = jest.fn()

  const prisonerId = 'A1234BC'
  const prisonId = 'HEI'

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    PrisonerSearchClientFactory.mockReturnValue(prisonerSearchClient)

    prisonerProfileService = new PrisonerProfileService(OrchestrationApiClientFactory, hmppsAuthClient)
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getProfile', () => {
    it('should retrieve and process data for prisoner profile', async () => {
      const prisonerProfile = TestData.prisonerProfile()
      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const prisonerProfilePage: PrisonerProfilePage = {
        alerts: [],
        flaggedAlerts: [],
        restrictions: [],
        visitsByMonth: new Map(),
        prisonerDetails: {
          prisonerId: 'A1234BC',
          firstName: 'John',
          lastName: 'Smith',
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
      }

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledWith(prisonId, prisonerId)
      expect(results).toStrictEqual(prisonerProfilePage)
    })

    it('should return visit balances as null if prisoner is on REMAND', async () => {
      const prisonerProfile = TestData.prisonerProfile({ convictedStatus: 'Remand' })
      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledWith(prisonId, prisonerId)
      expect(results.prisonerDetails.visitBalances).toBeNull()
    })

    it('should group upcoming and past visits by month, with totals for BOOKED only', async () => {
      const today = new Date()
      const nextMonth = new Date(addMonths(today, 1))
      const previousMonth = new Date(subMonths(today, 1))
      const nextMonthKey = format(nextMonth, 'MMMM yyyy')
      const previousMonthKey = format(previousMonth, 'MMMM yyyy')

      const upcomingVisit = TestData.visitSummary({ startTimestamp: nextMonth.toISOString() })
      const pastVisit = TestData.visitSummary({ startTimestamp: previousMonth.toISOString() })
      const cancelledVisit = TestData.visitSummary({
        visitStatus: 'CANCELLED',
        startTimestamp: previousMonth.toISOString(),
      })

      const prisonerProfile = TestData.prisonerProfile({
        visits: [upcomingVisit, pastVisit, cancelledVisit],
      })

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(results.visitsByMonth).toEqual(
        new Map([
          [nextMonthKey, { upcomingCount: 1, pastCount: 0, visits: [upcomingVisit] }],
          [previousMonthKey, { upcomingCount: 0, pastCount: 1, visits: [pastVisit, cancelledVisit] }],
        ]),
      )
    })

    it('should filter alerts to be flagged', async () => {
      const alertsToFlag = [
        TestData.alert({ alertCode: 'UPIU' }),
        TestData.alert({ alertCode: 'RCDR' }),
        TestData.alert({ alertCode: 'URCU' }),
      ]
      const alertNotToFlag = TestData.alert({ alertCode: 'XR' })

      const prisonerProfile = TestData.prisonerProfile({
        alerts: [alertNotToFlag, ...alertsToFlag],
      })

      prisonerProfile.alerts = [alertNotToFlag, ...alertsToFlag]

      orchestrationApiClient.getPrisonerProfile.mockResolvedValue(prisonerProfile)

      const results = await prisonerProfileService.getProfile(prisonId, prisonerId, 'user')

      expect(OrchestrationApiClientFactory).toHaveBeenCalledWith(token)
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user')
      expect(orchestrationApiClient.getPrisonerProfile).toHaveBeenCalledWith(prisonId, prisonerId)

      expect(results.alerts).toStrictEqual([alertNotToFlag, ...alertsToFlag])
      expect(results.flaggedAlerts).toStrictEqual(alertsToFlag)
    })
  })
})
