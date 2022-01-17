import { NotFound } from 'http-errors'
import { addDays, startOfMonth, addMonths, format } from 'date-fns'
import PrisonApiClient from '../data/prisonApiClient'
import { PrisonerProfile, SystemToken, BAPVVisitBalances, PrisonerAlertItem } from '../@types/bapv'
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
    const visitBalances = await this.getVisitBalances(prisonApiClient, convictedStatus, offenderNo)
    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDatePretty({ dateToFormat: inmateDetail.dateOfBirth })
    const alerts = inmateDetail.alerts || []
    const activeAlerts: Alert[] = alerts.filter(alert => alert.active)
    const flaggedAlerts: Alert[] = activeAlerts.filter(alert => this.alertCodesToFlag.includes(alert.alertCode))

    const activeAlertsForDisplay: PrisonerAlertItem[] = activeAlerts.map(alert => {
      return [
        { text: `${alert.alertTypeDescription} (${alert.alertType})` },
        { text: `${alert.alertCodeDescription} (${alert.alertCode})` },
        { text: alert.comment },
        {
          html: alert.dateCreated
            ? prisonerDatePretty({ dateToFormat: alert.dateCreated, wrapDate: false })
            : 'Not entered',
        },
        {
          html: alert.dateExpires
            ? prisonerDatePretty({ dateToFormat: alert.dateExpires, wrapDate: false })
            : 'Not entered',
        },
      ]
    })

    return {
      displayName,
      displayDob,
      activeAlerts: activeAlertsForDisplay,
      flaggedAlerts,
      inmateDetail,
      convictedStatus,
      visitBalances,
    }
  }

  private async getVisitBalances(
    prisonApiClient: PrisonApiClient,
    convictedStatus: string,
    offenderNo: string
  ): Promise<BAPVVisitBalances> {
    if (convictedStatus === 'Remand') return null

    const visitBalances = (await prisonApiClient.getVisitBalances(offenderNo)) as BAPVVisitBalances

    if (visitBalances.latestIepAdjustDate) {
      visitBalances.nextIepAdjustDate = format(
        addDays(getDateFromAPI(visitBalances.latestIepAdjustDate), 14),
        'd MMMM yyyy'
      )
      visitBalances.latestIepAdjustDate = prisonerDatePretty({ dateToFormat: visitBalances.latestIepAdjustDate })
    }

    if (visitBalances.latestPrivIepAdjustDate) {
      visitBalances.nextPrivIepAdjustDate = format(
        addMonths(startOfMonth(getDateFromAPI(visitBalances.latestPrivIepAdjustDate)), 1),
        'd MMMM yyyy'
      )
      visitBalances.latestPrivIepAdjustDate = prisonerDatePretty({
        dateToFormat: visitBalances.latestPrivIepAdjustDate,
      })
    }

    return visitBalances
  }
}
