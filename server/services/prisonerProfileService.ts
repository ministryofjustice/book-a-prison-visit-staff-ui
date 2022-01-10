import { NotFound } from 'http-errors'
import PrisonApiClient from '../data/prisonApiClient'
import { FlaggedAlert, PrisonerProfile, SystemToken } from '../@types/bapv'
import { prisonerDobPretty, properCaseFullName } from '../utils/utils'
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
    }

    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDobPretty(inmateDetail.dateOfBirth)
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

  private filterAlerts(alerts: Alert[]): FlaggedAlert[] {
    const flaggedAlerts: FlaggedAlert[] = []

    if (Array.isArray(alerts)) {
      alerts.forEach(alert => {
        if (alert.active && this.alertCodesToFlag.includes(alert.alertCode)) {
          flaggedAlerts.push({
            alertCode: alert.alertCode,
            alertCodeDescription: alert.alertCodeDescription,
          })
        }
      })
    }

    return flaggedAlerts
  }
}
