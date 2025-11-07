import { VisitorListItem } from '../@types/bapv'
import { buildVisitorListItem } from '../utils/visitorUtils'
import { HmppsAuthClient, PrisonerContactRegistryApiClient, RestClientBuilder } from '../data'

export default class PrisonerVisitorsService {
  constructor(
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVisitors(offenderNo: string, policyNoticeDaysMax: number, username: string): Promise<VisitorListItem[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    const socialContacts = await prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

    const visitorList: VisitorListItem[] = []
    socialContacts.forEach(contact => {
      visitorList.push(buildVisitorListItem(contact, policyNoticeDaysMax))
    })

    return visitorList
  }
}
