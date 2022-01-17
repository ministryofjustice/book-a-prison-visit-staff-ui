import { NotFound } from 'http-errors'
import PrisonerProfileService from './prisonerProfileService'
import PrisonApiClient from '../data/prisonApiClient'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import { Alert, InmateDetail, PageOfPrisonerBookingSummary, VisitBalances } from '../data/prisonApiTypes'
import { PrisonerAlertItem } from '../@types/bapv'

jest.mock('../data/prisonApiClient')
jest.mock('../data/visitSchedulerApiClient')

const offenderNo = 'A1234BC'
const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const visitSchedulerApiClient = new VisitSchedulerApiClient(null) as jest.Mocked<VisitSchedulerApiClient>

describe('Prisoner profile service', () => {
  let prisonApiClientBuilder
  let visitSchedulerApiClientBuilder
  let prisonerProfileService: PrisonerProfileService
  let systemToken

  describe('getProfile', () => {
    beforeEach(() => {
      systemToken = async (user: string): Promise<string> => `${user}-token-1`
      prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
      visitSchedulerApiClientBuilder = jest.fn().mockReturnValue(visitSchedulerApiClient)
      prisonerProfileService = new PrisonerProfileService(
        prisonApiClientBuilder,
        visitSchedulerApiClientBuilder,
        systemToken
      )
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('Retrieves and processes data for prisoner profile with visit balances', async () => {
      const bookings = <PageOfPrisonerBookingSummary>{
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

      const inmateDetail = <InmateDetail>{
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1980-10-12',
        activeAlertCount: 1,
        inactiveAlertCount: 3,
        legalStatus: 'SENTENCED',
      }

      const visitBalances: VisitBalances = {
        remainingVo: 1,
        remainingPvo: 2,
        latestIepAdjustDate: '2021-04-21',
        latestPrivIepAdjustDate: '2021-12-01',
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      prisonApiClient.getVisitBalances.mockResolvedValue(visitBalances)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(offenderNo, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).toHaveBeenCalledTimes(1)
      expect(results).toEqual({
        displayName: 'Smith, John',
        displayDob: '12 October 1980',
        activeAlerts: [],
        flaggedAlerts: [],
        inmateDetail,
        convictedStatus: 'Convicted',
        visitBalances,
        upcomingVisits: [],
      })
    })

    it('Does not look up visit balances for those on REMAND', async () => {
      const bookings = <PageOfPrisonerBookingSummary>{
        content: [
          {
            bookingId: 22345,
            bookingNo: 'B123445',
            offenderNo: 'B2345CD',
            firstName: 'FRED',
            lastName: 'JAMES',
            dateOfBirth: '1985-12-11',
            agencyId: 'HEI',
            legalStatus: 'REMAND',
            convictedStatus: 'Remand',
          },
        ],
        numberOfElements: 1,
      }

      const inmateDetail = <InmateDetail>{
        offenderNo: 'B2345CD',
        firstName: 'FRED',
        lastName: 'JAMES',
        dateOfBirth: '1985-12-11',
        activeAlertCount: 2,
        inactiveAlertCount: 4,
        legalStatus: 'REMAND',
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(offenderNo, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).not.toHaveBeenCalled()
      expect(results).toEqual({
        displayName: 'James, Fred',
        displayDob: '11 December 1985',
        activeAlerts: [],
        flaggedAlerts: [],
        inmateDetail,
        convictedStatus: 'Remand',
        visitBalances: null,
        upcomingVisits: [],
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
          },
          {
            text: 'Racist (XR)',
          },
          {
            text: 'Test',
          },
          {
            html: '<span class="bapv-table_cell--nowrap">1 January</span> 2022',
          },
          {
            html: 'Not entered',
          },
        ],
        [
          {
            text: 'COVID unit management (U)',
          },
          {
            text: 'Protective Isolation Unit (UPIU)',
          },
          {
            text: 'Test',
          },
          {
            html: '<span class="bapv-table_cell--nowrap">2 January</span> 2022',
          },
          {
            html: 'Not entered',
          },
        ],
        [
          {
            text: 'Risk (R)',
          },
          {
            text: 'Quarantined – Communicable Disease Risk (RCDR)',
          },
          {
            text: 'Test',
          },
          {
            html: '<span class="bapv-table_cell--nowrap">3 January</span> 2022',
          },
          {
            html: 'Not entered',
          },
        ],
        [
          {
            text: 'COVID unit management (U)',
          },
          {
            text: 'Reverse Cohorting Unit (URCU)',
          },
          {
            text: 'Test',
          },
          {
            html: '<span class="bapv-table_cell--nowrap">4 January</span> 2022',
          },
          {
            html: 'Not entered',
          },
        ],
      ]

      const bookings = <PageOfPrisonerBookingSummary>{
        content: [
          {
            bookingId: 22345,
            bookingNo: 'B123445',
            offenderNo: 'B2345CD',
            firstName: 'FRED',
            lastName: 'JAMES',
            dateOfBirth: '1985-12-11',
            agencyId: 'HEI',
            legalStatus: 'REMAND',
            convictedStatus: 'Remand',
          },
        ],
        numberOfElements: 1,
      }

      const inmateDetail = <InmateDetail>{
        offenderNo: 'B2345CD',
        firstName: 'FRED',
        lastName: 'JAMES',
        dateOfBirth: '1985-12-11',
        activeAlertCount: 4,
        inactiveAlertCount: 1,
        legalStatus: 'REMAND',
        alerts: [inactiveAlert, nonRelevantAlert, ...alertsToFlag],
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)
      prisonApiClient.getOffender.mockResolvedValue(inmateDetail)
      visitSchedulerApiClient.getUpcomingVisits.mockResolvedValue([])

      const results = await prisonerProfileService.getProfile(offenderNo, 'user')

      expect(prisonApiClient.getBookings).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getOffender).toHaveBeenCalledTimes(1)
      expect(prisonApiClient.getVisitBalances).not.toHaveBeenCalled()
      expect(results).toEqual({
        displayName: 'James, Fred',
        displayDob: '11 December 1985',
        activeAlerts: alertsForDisplay,
        flaggedAlerts: alertsToFlag,
        inmateDetail,
        convictedStatus: 'Remand',
        visitBalances: null,
        upcomingVisits: [],
      })
    })

    it('Throws 404 if no bookings found for criteria', async () => {
      // e.g. offenderNo doesn't exist - or not at specified prisonId
      const bookings = <PageOfPrisonerBookingSummary>{
        content: [],
        numberOfElements: 0,
      }

      prisonApiClient.getBookings.mockResolvedValue(bookings)

      await expect(async () => {
        await prisonerProfileService.getProfile(offenderNo, 'user')
      }).rejects.toBeInstanceOf(NotFound)
    })
  })
})
