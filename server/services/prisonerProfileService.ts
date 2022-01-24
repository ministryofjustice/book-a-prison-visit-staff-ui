import { NotFound } from 'http-errors'
import { addDays, startOfMonth, addMonths, format, parseISO } from 'date-fns'
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
  Visit,
  Contact,
} from '../@types/bapv'
import { prisonerDatePretty, properCaseFullName, prisonerDateTimePretty } from '../utils/utils'
import { Alert } from '../data/prisonApiTypes'

type PrisonApiClientBuilder = (token: string) => PrisonApiClient
type VisitSchedulerApiClientBuilder = (token: string) => VisitSchedulerApiClient
type PrisonerContactRegistryApiClientBuilder = (token: string) => PrisonerContactRegistryApiClient

export default class PrisonerProfileService {
  private alertCodesToFlag = ['UPIU', 'RCDR', 'URCU']

  constructor(
    private readonly prisonApiClientBuilder: PrisonApiClientBuilder,
    private readonly visitSchedulerApiClientBuilder: VisitSchedulerApiClientBuilder,
    private readonly prisonerContactRegistryApiClientBuilder: PrisonerContactRegistryApiClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  async getProfile(offenderNo: string, username: string): Promise<PrisonerProfile> {
    const token = await this.systemToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)
    const bookings = await prisonApiClient.getBookings(offenderNo)

    if (bookings.numberOfElements !== 1) throw new NotFound()

    const visitSchedulerApiClient = this.visitSchedulerApiClientBuilder(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientBuilder(token)
    const inmateDetail = await prisonApiClient.getOffender(offenderNo)
    const { convictedStatus } = bookings.content[0]
    const visitBalances = await this.getVisitBalances(prisonApiClient, convictedStatus, offenderNo)
    const displayName = properCaseFullName(`${inmateDetail.lastName}, ${inmateDetail.firstName}`)
    const displayDob = prisonerDatePretty({ dateToFormat: inmateDetail.dateOfBirth })
    const alerts = inmateDetail.alerts || []
    const activeAlerts: Alert[] = alerts.filter(alert => alert.active)
    const flaggedAlerts: Alert[] = activeAlerts.filter(alert => this.alertCodesToFlag.includes(alert.alertCode))
    const upcomingVisits: UpcomingVisitItem[] = await this.getUpcomingVisits(
      offenderNo,
      visitSchedulerApiClient,
      prisonerContactRegistryApiClient
    )
    const pastVisits: PastVisitItem[] = await this.getPastVisits(
      offenderNo,
      visitSchedulerApiClient,
      prisonerContactRegistryApiClient
    )

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
      upcomingVisits,
      pastVisits,
    }
  }

  private async getUpcomingVisits(
    offenderNo: string,
    visitSchedulerApiClient: VisitSchedulerApiClient,
    prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient
  ): Promise<UpcomingVisitItem[]> {
    const visits: Visit[] = await visitSchedulerApiClient.getUpcomingVisits(offenderNo)
    const contacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(offenderNo)
    const socialVisits: Visit[] = visits.filter(visit => visit.visitType === 'STANDARD_SOCIAL')

    const visitsForDisplay: UpcomingVisitItem[] = await Promise.all(
      socialVisits.map(async visit => {
        const startTime = format(parseISO(visit.startTimestamp), 'HH:mmb')
        const endTime = visit.endTimestamp ? ` - ${format(parseISO(visit.endTimestamp), 'HH:mmb')}` : ''
        const visitors: number[] = visit.visitors.reduce((personIds, visitor) => {
          personIds.push(visitor.nomisPersonId)

          return personIds
        }, [])
        const visitContactNames = await this.getPrisonerSocialContacts(contacts, visitors)

        return [
          { text: `${visit.visitTypeDescription}` },
          { text: 'Hewell (HMP)' },
          {
            text: visit.startTimestamp
              ? `${prisonerDateTimePretty(visit.startTimestamp)} ${startTime}${endTime}`
              : 'N/A',
          },
          { html: `<p>${visitContactNames.join('<br>')}</p>` },
        ] as UpcomingVisitItem
      })
    )

    return visitsForDisplay
  }

  private async getPastVisits(
    offenderNo: string,
    visitSchedulerApiClient: VisitSchedulerApiClient,
    prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient
  ): Promise<PastVisitItem[]> {
    const visits: Visit[] = await visitSchedulerApiClient.getPastVisits(offenderNo)
    const contacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(offenderNo)
    const socialVisits: Visit[] = visits.filter(visit => visit.visitType === 'STANDARD_SOCIAL')

    const visitsForDisplay: PastVisitItem[] = await Promise.all(
      socialVisits.map(async visit => {
        const startTime = format(parseISO(visit.startTimestamp), 'HH:mmb')
        const endTime = visit.endTimestamp ? ` - ${format(parseISO(visit.endTimestamp), 'HH:mmb')}` : ''
        const visitors: number[] = visit.visitors.reduce((personIds, visitor) => {
          personIds.push(visitor.nomisPersonId)

          return personIds
        }, [])
        const visitContactNames = await this.getPrisonerSocialContacts(contacts, visitors)

        return [
          { text: `${visit.visitTypeDescription}` },
          { text: 'Hewell (HMP)' },
          {
            text: visit.startTimestamp
              ? `${prisonerDateTimePretty(visit.startTimestamp)} ${startTime}${endTime}`
              : 'N/A',
          },
          { html: `<p>${visitContactNames.join('<br>')}</p>` },
          { text: `${visit.visitStatusDescription}` },
        ] as PastVisitItem
      })
    )

    return visitsForDisplay
  }

  private async getPrisonerSocialContacts(contacts: Contact[], contactIds: number[]): Promise<string[]> {
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
    offenderNo: string
  ): Promise<BAPVVisitBalances> {
    if (convictedStatus === 'Remand') return null

    const visitBalances = (await prisonApiClient.getVisitBalances(offenderNo)) as BAPVVisitBalances

    if (visitBalances.latestIepAdjustDate) {
      visitBalances.nextIepAdjustDate = format(addDays(parseISO(visitBalances.latestIepAdjustDate), 14), 'd MMMM yyyy')
      visitBalances.latestIepAdjustDate = prisonerDatePretty({
        dateToFormat: visitBalances.latestIepAdjustDate,
      })
    }

    if (visitBalances.latestPrivIepAdjustDate) {
      visitBalances.nextPrivIepAdjustDate = format(
        addMonths(startOfMonth(parseISO(visitBalances.latestPrivIepAdjustDate)), 1),
        'd MMMM yyyy'
      )
      visitBalances.latestPrivIepAdjustDate = prisonerDatePretty({
        dateToFormat: visitBalances.latestPrivIepAdjustDate,
      })
    }

    return visitBalances
  }
}
