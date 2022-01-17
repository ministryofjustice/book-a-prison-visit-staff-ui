import { NotFound } from 'http-errors'
import { addDays, startOfMonth, addMonths, format } from 'date-fns'
import PrisonApiClient from '../data/prisonApiClient'
import { PrisonerProfile, SystemToken, BAPVVisitBalances } from '../@types/bapv'
import { prisonerDatePretty, properCaseFullName, getDateFromAPI } from '../utils/utils'
import { Alert } from '../data/prisonApiTypes'

type PrisonApiClientBuilder = (token: string) => PrisonApiClient

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly prisonApiClientBuilder: PrisonApiClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  async getProfile(offenderNo: string, username: string): Promise<PrisonerProfile> {
    const token = await this.systemToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)
    const bookings = await prisonApiClient.getBookings(offenderNo)

    if (bookings.numberOfElements !== 1) throw new NotFound()

    const { convictedStatus } = bookings.content[0]
    const inmateDetail = await prisonApiClient.getOffender(offenderNo)

    let visitBalances = null

    if (convictedStatus !== 'Remand') {
      visitBalances = (await prisonApiClient.getVisitBalances(offenderNo)) as BAPVVisitBalances

      if (visitBalances.latestIepAdjustDate) {
        visitBalances.nextIepAdjustDate = format(
          addDays(getDateFromAPI(visitBalances.latestIepAdjustDate), 14),
          'd MMMM yyyy'
        )
        visitBalances.latestIepAdjustDate = prisonerDatePretty(visitBalances.latestIepAdjustDate)
      }

      if (visitBalances.latestPrivIepAdjustDate) {
        visitBalances.nextPrivIepAdjustDate = format(
          addMonths(startOfMonth(getDateFromAPI(visitBalances.latestPrivIepAdjustDate)), 1),
          'd MMMM yyyy'
        )
        visitBalances.latestPrivIepAdjustDate = prisonerDatePretty(visitBalances.latestPrivIepAdjustDate)
      }
    }

    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDatePretty(inmateDetail.dateOfBirth)
    const flaggedAlerts = this.filterAlerts(inmateDetail.alerts)

    return {
      displayName,
      displayDob,
      flaggedAlerts,
      inmateDetail,
      convictedStatus,
      visitBalances,
    }
  }

  private filterAlerts(alerts: Alert[]): Alert[] {
    if (Array.isArray(alerts)) {
      const flaggedAlerts: Alert[] = alerts.filter(alert => {
        return alert.active && this.alertCodesToFlag.includes(alert.alertCode)
      })

      return flaggedAlerts
    }

    return []
  }
}
