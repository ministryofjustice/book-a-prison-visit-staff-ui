import { VisitorListItem } from '../@types/bapv'
import { Visit } from '../data/orchestrationApiTypes'
import buildVisitorListItem from '../utils/visitorUtils'
import { getSupportTypeDescriptions } from '../routes/visitorUtils'
import { HmppsAuthClient, PrisonerContactRegistryApiClient, RestClientBuilder, VisitSchedulerApiClient } from '../data'
import VisitSessionsService from './visitSessionsService'

export default class VisitService {
  constructor(
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly visitSchedulerApiClientFactory: RestClientBuilder<VisitSchedulerApiClient>,
    private readonly visitSessionsService: VisitSessionsService,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getFullVisitDetails({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<{ visit: Visit; visitors: VisitorListItem[]; additionalSupport: string[] }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    const visit = await visitSchedulerApiClient.getVisit(reference)
    const contacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(visit.prisonerId)
    const visitorIds = visit.visitors.map(visitor => visitor.nomisPersonId)

    const visitors = contacts
      .filter(contact => visitorIds.includes(contact.personId))
      .map(contact => buildVisitorListItem(contact))

    const additionalSupport = getSupportTypeDescriptions(
      await this.visitSessionsService.getAvailableSupportOptions(username),
      visit.visitorSupport,
    )

    return { visit, visitors, additionalSupport }
  }
}
