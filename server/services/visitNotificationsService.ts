import { FilterField, VisitsReviewListItem } from '../@types/bapv'
import { notificationTypes } from '../constants/notificationEventTypes'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { NotificationCount, NotificationGroup } from '../data/orchestrationApiTypes'
import { prisonerDateTimePretty } from '../utils/utils'

type AppliedFilters = Record<'bookedBy' | 'type', string[]>

export default class VisitNotificationsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getNotificationCount(username: string, prisonId: string): Promise<NotificationCount> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getNotificationCount(prisonId)
  }

  private buildVisitReviewListFilters(
    username: string,
    notificationGroups: NotificationGroup[],
    appliedFilters: AppliedFilters,
  ): FilterField[] {
    if (!notificationGroups.length) return []

    const bookedBy = new Map<string, string>()
    const bookedByFilterItems: FilterField['items'] = []

    const allAffectedVisits = notificationGroups.flatMap(notificationGroup => notificationGroup.affectedVisits)
    allAffectedVisits.forEach(visit => bookedBy.set(visit.bookedByUserName, visit.bookedByName))
    bookedBy.forEach((label, value) =>
      bookedByFilterItems.push({ label, value, checked: appliedFilters.bookedBy.includes(value) }),
    )
    // sort usernames alphabetically but with current user at top, if present
    bookedByFilterItems.sort((a, b) => (b.value === username ? 1 : a.label.localeCompare(b.label)))

    const type = new Map<string, string>()
    const typeFilterItems: FilterField['items'] = []

    notificationGroups.forEach(notificationGroup =>
      type.set(notificationGroup.type, notificationTypes[notificationGroup.type]),
    )
    type.forEach((label, value) => typeFilterItems.push({ label, value, checked: appliedFilters.type.includes(value) }))
    typeFilterItems.sort((a, b) => a.label.localeCompare(b.label))

    return [
      {
        id: 'bookedBy',
        label: 'Booked by',
        items: bookedByFilterItems,
      },
      {
        id: 'type',
        label: 'Reason',
        items: typeFilterItems,
      },
    ]
  }

  private buildVisitsReviewListItem(notificationGroup: NotificationGroup): VisitsReviewListItem {
    const bookedByNames = notificationGroup.affectedVisits.map(visit => visit.bookedByName)

    const prisonerNumbers =
      notificationGroup.type === 'NON_ASSOCIATION_EVENT'
        ? notificationGroup.affectedVisits.map(visit => visit.prisonerNumber)
        : [notificationGroup.affectedVisits[0].prisonerNumber]

    const visitDates =
      notificationGroup.type === 'NON_ASSOCIATION_EVENT'
        ? [prisonerDateTimePretty(notificationGroup.affectedVisits[0].visitDate)]
        : notificationGroup.affectedVisits.map(visit => prisonerDateTimePretty(visit.visitDate))

    return {
      bookedByNames,
      prisonerNumbers,
      reference: notificationGroup.reference,
      type: notificationGroup.type,
      visitDates,
    }
  }

  private filterNotificationGroups(
    appliedFilters: AppliedFilters,
    notificationGroups: NotificationGroup[],
  ): NotificationGroup[] {
    if (!Object.values(appliedFilters).flat().length) return notificationGroups

    return notificationGroups.filter(notificationGroup => {
      const allBookingUsers = notificationGroup.affectedVisits.flatMap(visit => visit.bookedByUserName)
      const isUsernameMatch = appliedFilters.bookedBy.some(user => allBookingUsers.includes(user))

      const isTypeMatch = appliedFilters.type.some(type => type === notificationGroup.type)

      return isUsernameMatch || isTypeMatch
    })
  }

  async getVisitsReviewList(
    username: string,
    prisonId: string,
    appliedFilters: AppliedFilters,
  ): Promise<{ filters: FilterField[]; visitsReviewList: VisitsReviewListItem[] }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const unfilteredNotificationGroups = await orchestrationApiClient.getNotificationGroups(prisonId)
    const filteredNotificationGroups = this.filterNotificationGroups(appliedFilters, unfilteredNotificationGroups)

    const filters = this.buildVisitReviewListFilters(username, unfilteredNotificationGroups, appliedFilters)
    const visitsReviewList = filteredNotificationGroups.map(notificationGroup =>
      this.buildVisitsReviewListItem(notificationGroup),
    )

    return { filters, visitsReviewList }
  }
}
