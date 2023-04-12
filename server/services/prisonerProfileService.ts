import { NotFound } from 'http-errors'
import {
  PrisonerProfile,
  BAPVVisitBalances,
  PrisonerAlertItem,
  UpcomingVisitItem,
  PastVisitItem,
  PrisonerDetails,
} from '../@types/bapv'
import {
  prisonerDatePretty,
  properCaseFullName,
  properCase,
  visitDateAndTime,
  nextIepAdjustDate,
  nextPrivIepAdjustDate,
  formatVisitType,
} from '../utils/utils'
import { Alert, InmateDetail, OffenderRestriction, VisitBalances } from '../data/prisonApiTypes'
import { Visitor } from '../data/orchestrationApiTypes'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import SupportedPrisonsService from './supportedPrisonsService'
import {
  HmppsAuthClient,
  OrchestrationApiClient,
  PrisonApiClient,
  PrisonerContactRegistryApiClient,
  PrisonerSearchClient,
  RestClientBuilder,
  VisitSchedulerApiClient,
} from '../data'

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
    private readonly visitSchedulerApiClientFactory: RestClientBuilder<VisitSchedulerApiClient>,
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly prisonerSearchClientFactory: RestClientBuilder<PrisonerSearchClient>,
    private readonly supportedPrisonsService: SupportedPrisonsService,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getProfile(prisonId: string, prisonerId: string, username: string): Promise<PrisonerProfile> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const fullPrisoner = await orchestrationApiClient.getPrisonerProfile(prisonId, prisonerId)

    const displayName = properCaseFullName(`${fullPrisoner.lastName}, ${fullPrisoner.firstName}`)
    const displayDob = prisonerDatePretty({ dateToFormat: fullPrisoner.dateOfBirth })

    const alerts = fullPrisoner.alerts || []
    const activeAlerts: Alert[] = alerts.filter(alert => alert.active)
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

    const { convictedStatus, incentiveLevel } = fullPrisoner

    const { visitBalances } = fullPrisoner

    const { visits } = fullPrisoner

    const prisonerDetails: PrisonerDetails = {
      offenderNo: fullPrisoner.prisonerId,
      category: fullPrisoner.category,
      location: fullPrisoner.cellLocation,
    }

    return {
      displayName,
      displayDob,
      activeAlerts: activeAlertsForDisplay,
      flaggedAlerts,
      convictedStatus,
      incentiveLevel,
      visitBalances,
      visits,
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

  private async getUpcomingVisits(
    offenderNo: string,
    socialContacts: Contact[],
    visitSchedulerApiClient: VisitSchedulerApiClient,
    supportedPrisons: Record<string, string>,
  ): Promise<UpcomingVisitItem[]> {
    const { content: visits } = await visitSchedulerApiClient.getUpcomingVisits(offenderNo, ['CANCELLED', 'BOOKED'])
    const socialVisits = visits.filter(visit => visit.visitType === 'SOCIAL')

    const visitsForDisplay: UpcomingVisitItem[] = socialVisits.map(visit => {
      const visitContactNames = this.getPrisonerSocialContacts(socialContacts, visit.visitors)

      return [
        {
          html: `<a href='/visit/${visit.reference}'>${visit.reference}</a>`,
          attributes: {
            'data-test': 'tab-upcoming-reference',
          },
        },
        {
          html: formatVisitType(visit.visitType),
          attributes: {
            'data-test': 'tab-upcoming-type',
          },
        },
        {
          text: supportedPrisons[visit.prisonId],
          attributes: {
            'data-test': 'tab-upcoming-location',
          },
        },
        {
          html: visit.startTimestamp
            ? `<p>${visitDateAndTime({ startTimestamp: visit.startTimestamp, endTimestamp: visit.endTimestamp })}</p>`
            : '<p>N/A</p>',
          attributes: {
            'data-test': 'tab-upcoming-date-and-time',
          },
        },
        {
          html: `<p>${visitContactNames.join('<br>')}</p>`,
          attributes: {
            'data-test': 'tab-upcoming-visitors',
          },
        },
        {
          text: `${properCase(visit.visitStatus)}`,
          attributes: {
            'data-test': 'tab-upcoming-status',
          },
        },
      ] as UpcomingVisitItem
    })

    return visitsForDisplay
  }

  private async getPastVisits(
    offenderNo: string,
    socialContacts: Contact[],
    visitSchedulerApiClient: VisitSchedulerApiClient,
    supportedPrisons: Record<string, string>,
  ): Promise<PastVisitItem[]> {
    const { content: visits } = await visitSchedulerApiClient.getPastVisits(offenderNo, ['CANCELLED', 'BOOKED'])

    const socialVisits = visits.filter(visit => visit.visitType === 'SOCIAL')
    const visitsForDisplay: PastVisitItem[] = socialVisits.map(visit => {
      const visitContactNames = this.getPrisonerSocialContacts(socialContacts, visit.visitors)

      return [
        {
          html: `<a href='/visit/${visit.reference}'>${visit.reference}</a>`,
          attributes: {
            'data-test': 'tab-past-reference',
          },
        },
        {
          html: formatVisitType(visit.visitType),
          attributes: {
            'data-test': 'tab-past-type',
          },
        },
        {
          text: supportedPrisons[visit.prisonId],
          attributes: {
            'data-test': 'tab-past-location',
          },
        },
        {
          html: visit.startTimestamp
            ? `<p>${visitDateAndTime({ startTimestamp: visit.startTimestamp, endTimestamp: visit.endTimestamp })}</p>`
            : '<p>N/A</p>',
          attributes: {
            'data-test': 'tab-past-date-and-time',
          },
        },
        {
          html: `<p>${visitContactNames.join('<br>')}</p>`,
          attributes: {
            'data-test': 'tab-past-visitors',
          },
        },
        {
          text: `${properCase(visit.visitStatus)}`,
          attributes: {
            'data-test': 'tab-past-status',
          },
        },
      ] as PastVisitItem
    })

    return visitsForDisplay
  }

  private getPrisonerSocialContacts(contacts: Contact[], visitors: Visitor[]): string[] {
    const contactIds: number[] = visitors.reduce((personIds, visitor) => {
      personIds.push(visitor.nomisPersonId)

      return personIds
    }, [])

    const contactsForDisplay: string[] = contacts.reduce((contactNames, contact) => {
      if (contactIds.includes(contact.personId)) {
        contactNames.push(`${contact.firstName} ${contact.lastName}`)
      }

      return contactNames
    }, [])

    return contactsForDisplay
  }

  private async getVisitBalances(
    prisonApiClient: PrisonApiClient,
    convictedStatus: string,
    offenderNo: string,
  ): Promise<BAPVVisitBalances> {
    if (convictedStatus === 'Remand') return null

    const visitBalances = (await prisonApiClient.getVisitBalances(offenderNo)) as BAPVVisitBalances

    if (visitBalances?.latestIepAdjustDate) {
      visitBalances.nextIepAdjustDate = nextIepAdjustDate(visitBalances.latestIepAdjustDate)
      visitBalances.latestIepAdjustDate = prisonerDatePretty({
        dateToFormat: visitBalances.latestIepAdjustDate,
      })
    }

    if (visitBalances?.latestPrivIepAdjustDate) {
      visitBalances.nextPrivIepAdjustDate = nextPrivIepAdjustDate(visitBalances.latestPrivIepAdjustDate)
      visitBalances.latestPrivIepAdjustDate = prisonerDatePretty({
        dateToFormat: visitBalances.latestPrivIepAdjustDate,
      })
    }

    return visitBalances
  }
}
