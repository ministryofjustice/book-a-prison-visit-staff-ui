import { NotFound } from 'http-errors'
import { format, isBefore } from 'date-fns'
import { PrisonerAlertItem, PrisonerDetails, PrisonerProfilePage } from '../@types/bapv'
import { prisonerDatePretty, properCaseFullName } from '../utils/utils'
import { Alert, InmateDetail, OffenderRestriction, VisitBalances } from '../data/prisonApiTypes'
import { HmppsAuthClient, OrchestrationApiClient, PrisonApiClient, RestClientBuilder } from '../data'

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getProfile(prisonId: string, prisonerId: string, username: string): Promise<PrisonerProfilePage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const fullPrisoner = await orchestrationApiClient.getPrisonerProfile(prisonId, prisonerId)

    const alerts = fullPrisoner.alerts || []
    const activeAlerts: Alert[] = alerts.filter(alert => alert.active)
    const activeAlertCount = activeAlerts.length
    const flaggedAlerts: Alert[] = activeAlerts.filter(alert => this.alertCodesToFlag.includes(alert.alertCode))
    const activeAlertsForDisplay: PrisonerAlertItem[] = activeAlerts.map(alert => {
      return [
        {
          text: `${alert.alertTypeDescription} (${alert.alertType})`,
          attributes: {
            'data-test': 'tab-alerts-type-desc',
          },
        },
        {
          text: `${alert.alertCodeDescription} (${alert.alertCode})`,
          attributes: {
            'data-test': 'tab-alerts-code-desc',
          },
        },
        {
          text: alert.comment,
          classes: 'bapv-force-overflow',
          attributes: {
            'data-test': 'tab-alerts-comment',
          },
        },
        {
          html: alert.dateCreated
            ? prisonerDatePretty({ dateToFormat: alert.dateCreated, wrapDate: false })
            : 'Not entered',
          attributes: {
            'data-test': 'tab-alerts-created',
          },
        },
        {
          html: alert.dateExpires
            ? prisonerDatePretty({ dateToFormat: alert.dateExpires, wrapDate: false })
            : 'Not entered',
          attributes: {
            'data-test': 'tab-alerts-expires',
          },
        },
      ]
    })

    const visitsByMonth: PrisonerProfilePage['visitsByMonth'] = new Map()
    const now = new Date()

    fullPrisoner.visits.forEach(visit => {
      const visitStartTime = new Date(visit.startTimestamp)
      const visitMonth = format(visitStartTime, 'MMMM yyyy') // e.g. 'May 2023'

      if (!visitsByMonth.has(visitMonth)) {
        visitsByMonth.set(visitMonth, { upcomingCount: 0, pastCount: 0, visits: [] })
      }
      const month = visitsByMonth.get(visitMonth)

      if (visit.visitStatus === 'BOOKED') {
        const isUpcoming = isBefore(now, visitStartTime)
        if (isUpcoming) {
          month.upcomingCount += 1
        } else {
          month.pastCount += 1
        }
      }
      month.visits.push(visit)
    })

    const prisonerDetails: PrisonerDetails = {
      offenderNo: fullPrisoner.prisonerId,
      name: properCaseFullName(`${fullPrisoner.lastName}, ${fullPrisoner.firstName}`),
      dob: prisonerDatePretty({ dateToFormat: fullPrisoner.dateOfBirth }),
      convictedStatus: fullPrisoner.convictedStatus,
      category: fullPrisoner.category,
      location: fullPrisoner.cellLocation,
      prisonName: fullPrisoner.prisonName,
      incentiveLevel: fullPrisoner.incentiveLevel,
      visitBalances: fullPrisoner.visitBalances,
    }

    if (prisonerDetails.visitBalances?.latestIepAdjustDate) {
      prisonerDetails.visitBalances.latestIepAdjustDate = prisonerDatePretty({
        dateToFormat: prisonerDetails.visitBalances.latestIepAdjustDate,
      })
    }

    if (prisonerDetails.visitBalances?.latestPrivIepAdjustDate) {
      prisonerDetails.visitBalances.latestPrivIepAdjustDate = prisonerDatePretty({
        dateToFormat: prisonerDetails.visitBalances.latestPrivIepAdjustDate,
      })
    }

    return {
      activeAlerts: activeAlertsForDisplay,
      activeAlertCount,
      flaggedAlerts,
      visitsByMonth,
      prisonerDetails,
    }
  }

  async getPrisonerAndVisitBalances(
    offenderNo: string,
    prisonId: string,
    username: string,
  ): Promise<{ inmateDetail: InmateDetail; visitBalances: VisitBalances }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientFactory(token)

    const bookings = await prisonApiClient.getBookings(offenderNo, prisonId)
    if (bookings.numberOfElements !== 1) throw new NotFound()
    const { convictedStatus } = bookings.content[0]

    const inmateDetail = await prisonApiClient.getOffender(offenderNo)

    if (convictedStatus === 'Remand') {
      return { inmateDetail, visitBalances: undefined }
    }

    return { inmateDetail, visitBalances: await prisonApiClient.getVisitBalances(offenderNo) }
  }

  async getRestrictions(offenderNo: string, username: string): Promise<OffenderRestriction[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientFactory(token)
    const restrictions = await prisonApiClient.getOffenderRestrictions(offenderNo)

    if (!restrictions.bookingId) throw new NotFound()

    const { offenderRestrictions } = restrictions

    return offenderRestrictions
  }
}
