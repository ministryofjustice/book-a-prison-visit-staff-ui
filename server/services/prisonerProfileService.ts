import { NotFound } from 'http-errors'
import PrisonApiClient from '../data/prisonApiClient'
import VisitSchedulerApiClient from '../data/visitSchedulerApiClient'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import {
  PrisonerProfile,
  SystemToken,
  BAPVVisitBalances,
  PrisonerAlertItem,
  UpcomingVisitItem,
  PastVisitItem,
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
import { Visit, Visitor } from '../data/visitSchedulerApiTypes'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import SupportedPrisonsService from './supportedPrisonsService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

type PrisonApiClientBuilder = (token: string) => PrisonApiClient
type PrisonerSearchClientBuilder = (token: string) => PrisonerSearchClient
type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient
type PrisonerContactRegistryApiClientBuilder = (token: string) => PrisonerContactRegistryApiClient

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly prisonApiClientBuilder: PrisonApiClientBuilder,
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly prisonerContactRegistryApiClientBuilder: PrisonerContactRegistryApiClientBuilder,
    private readonly prisonerSearchClientBuilder: PrisonerSearchClientBuilder,
    private readonly supportedPrisonsService: SupportedPrisonsService,
    private readonly systemToken: SystemToken,
  ) {}

  async getProfile(offenderNo: string, prisonId: string, username: string): Promise<PrisonerProfile> {
    const token = await this.systemToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)
    const bookings = await prisonApiClient.getBookings(offenderNo, prisonId)

    if (bookings.numberOfElements !== 1) throw new NotFound()

    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientBuilder(token)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(token)

    const { convictedStatus } = bookings.content[0]
    const inmateDetail = await prisonApiClient.getOffender(offenderNo)
    const prisoner = await prisonerSearchClient.getPrisonerById(offenderNo)
    const incentiveLevel = prisoner.currentIncentive?.level.description || ''

    const visitBalances = await this.getVisitBalances(prisonApiClient, convictedStatus, offenderNo)
    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDatePretty({ dateToFormat: inmateDetail.dateOfBirth })
    const alerts = inmateDetail.alerts || []
    const activeAlerts: Alert[] = alerts.filter(alert => alert.active)
    const flaggedAlerts: Alert[] = activeAlerts.filter(alert => this.alertCodesToFlag.includes(alert.alertCode))

    const socialContacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(offenderNo)
    const supportedPrisons = await this.supportedPrisonsService.getSupportedPrisons(username)

    const upcomingVisits: UpcomingVisitItem[] = await this.getUpcomingVisits(
      offenderNo,
      socialContacts,
      visitSchedulerApiClient,
      supportedPrisons,
    )
    const pastVisits: PastVisitItem[] = await this.getPastVisits(
      offenderNo,
      socialContacts,
      visitSchedulerApiClient,
      supportedPrisons,
    )

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

    return {
      displayName,
      displayDob,
      activeAlerts: activeAlertsForDisplay,
      flaggedAlerts,
      inmateDetail,
      convictedStatus,
      incentiveLevel,
      visitBalances,
      upcomingVisits,
      pastVisits,
    }
  }

  async getPrisonerAndVisitBalances(
    offenderNo: string,
    prisonId: string,
    username: string,
  ): Promise<{ inmateDetail: InmateDetail; visitBalances: VisitBalances }> {
    const token = await this.systemToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)

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
    const token = await this.systemToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)
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
    const visits: Visit[] = await visitSchedulerApiClient.getUpcomingVisits(offenderNo, ['BOOKED', 'CANCELLED'])
    const socialVisits: Visit[] = visits.filter(visit => visit.visitType === 'SOCIAL')

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
    const visits: Visit[] = await visitSchedulerApiClient.getPastVisits(offenderNo, ['BOOKED', 'CANCELLED'])
    const socialVisits: Visit[] = visits.filter(visit => visit.visitType === 'SOCIAL')

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
