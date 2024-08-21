import { VisitorListItem } from '../@types/bapv'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import { buildVisitorListItem } from '../utils/visitorUtils'
import { HmppsAuthClient, PrisonerContactRegistryApiClient, RestClientBuilder } from '../data'

export default class PrisonerVisitorsService {
  constructor(
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVisitors(offenderNo: string, username: string): Promise<VisitorListItem[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    const allSocialContacts: Contact[] = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(
      true,
      offenderNo,
    )

    const visitorList: VisitorListItem[] = []
    allSocialContacts.forEach(contact => {
      visitorList.push(buildVisitorListItem(contact))
    })

    return visitorList
  }
}
