import { NotFound } from 'http-errors'
import { format, isBefore } from 'date-fns'
import { PrisonerAlertItem, PrisonerProfilePage } from '../@types/bapv'
import {
  nextIepAdjustDate,
  nextPrivIepAdjustDate,
  prisonerDatePretty,
  prisonerDateTimePretty,
  properCaseFullName,
} from '../utils/utils'
import { Alert, OffenderRestriction } from '../data/prisonApiTypes'
import {
  HmppsAuthClient,
  OrchestrationApiClient,
  PrisonApiClient,
  PrisonerContactRegistryApiClient,
  RestClientBuilder,
} from '../data'

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getProfile(prisonId: string, prisonerId: string, username: string): Promise<PrisonerProfilePage> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const prisonerProfile = await orchestrationApiClient.getPrisonerProfile(prisonId, prisonerId)

    // To remove when VB-2060 done - build list of contact IDs => contact name
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)
    const socialContacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(prisonerId)
    const contactNames: Record<number, string> = {}
    socialContacts.forEach(contact => {
      contactNames[contact.personId] = `${contact.firstName} ${contact.lastName}`
    })

    const alerts = prisonerProfile.alerts || []
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

    prisonerProfile.visits.forEach(visit => {
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

    const prisonerDetails: PrisonerProfilePage['prisonerDetails'] = {
      prisonerId,
      name: properCaseFullName(`${prisonerProfile.lastName}, ${prisonerProfile.firstName}`),
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
      activeAlerts: activeAlertsForDisplay,
      activeAlertCount,
      flaggedAlerts,
      prisonerDetails,
      visitsByMonth,
      contactNames,
    }
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
