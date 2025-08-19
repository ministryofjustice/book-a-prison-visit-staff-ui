import { format, isBefore } from 'date-fns'
import { PrisonerProfilePage } from '../@types/bapv'
import { convertToTitleCase, nextIepAdjustDate, nextPrivIepAdjustDate, prisonerDateTimePretty } from '../utils/utils'
import { Alert, Visit } from '../data/orchestrationApiTypes'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getProfile(prisonId: string, prisonerId: string, username: string): Promise<PrisonerProfilePage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const prisonerProfile = await orchestrationApiClient.getPrisonerProfile(prisonId, prisonerId)

    const { alerts, prisonerRestrictions } = prisonerProfile
    const flaggedAlerts: Alert[] = alerts.filter(alert => this.alertCodesToFlag.includes(alert.alertCode))

    const visitsByMonth: PrisonerProfilePage['visitsByMonth'] = new Map()
    const now = new Date()

    prisonerProfile.visits.forEach(visit => {
      const visitStartTime = new Date(visit.startTimestamp)
      const visitMonth = format(visitStartTime, 'MMMM yyyy') // e.g. 'May 2023'

      if (!visitsByMonth.has(visitMonth)) {
        visitsByMonth.set(visitMonth, { upcomingCount: 0, pastCount: 0, visits: [] })
      }
      const month = visitsByMonth.get(visitMonth)
      const allowedSubStatuses: Partial<Visit['visitSubStatus']>[] = ['APPROVED', 'AUTO_APPROVED', 'REQUESTED']

      if (allowedSubStatuses.includes(visit.visitSubStatus)) {
        const isUpcoming = isBefore(now, visitStartTime)
        if (isUpcoming) {
          month.upcomingCount += 1
        } else {
          month.pastCount += 1
        }
      }
      month.visits.push(visit)
    })

    const prisonerDetails: PrisonerProfilePage['prisonerDetails'] = {
      prisonerId,
      firstName: convertToTitleCase(prisonerProfile.firstName),
      lastName: convertToTitleCase(prisonerProfile.lastName),
      dateOfBirth: prisonerDateTimePretty(prisonerProfile.dateOfBirth),
      cellLocation: prisonerProfile.cellLocation,
      prisonName: prisonerProfile.prisonName,
      convictedStatus: prisonerProfile.convictedStatus,
      category: prisonerProfile.category,
      incentiveLevel: prisonerProfile.incentiveLevel,
      visitBalances: prisonerProfile.convictedStatus === 'Convicted' ? prisonerProfile.visitBalances : null,
    }

    const { visitBalances } = prisonerDetails
    if (visitBalances) {
      if (visitBalances.latestIepAdjustDate) {
        visitBalances.nextIepAdjustDate = nextIepAdjustDate(visitBalances.latestIepAdjustDate)
        visitBalances.latestIepAdjustDate = prisonerDateTimePretty(visitBalances.latestIepAdjustDate)
      }
      if (visitBalances.latestPrivIepAdjustDate) {
        visitBalances.nextPrivIepAdjustDate = nextPrivIepAdjustDate(visitBalances.latestPrivIepAdjustDate)
        visitBalances.latestPrivIepAdjustDate = prisonerDateTimePretty(visitBalances.latestPrivIepAdjustDate)
      }
    }

    return {
      alerts,
      flaggedAlerts,
      restrictions: prisonerRestrictions,
      prisonerDetails,
      visitsByMonth,
    }
  }
}
