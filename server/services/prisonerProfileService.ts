import { NotFound } from 'http-errors'
import PrisonApiClient from '../data/prisonApiClient'
import { PrisonerProfile, SystemToken } from '../@types/bapv'
import { prisonerDatePretty, properCaseFullName } from '../utils/utils'
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
      visitBalances = await prisonApiClient.getVisitBalances(offenderNo)

      if (visitBalances.latestIepAdjustDate) {
        visitBalances.latestIepAdjustDate = prisonerDatePretty(visitBalances.latestIepAdjustDate)
      }

      if (visitBalances.latestPrivIepAdjustDate) {
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
