import { SystemToken, VisitorListItem } from '../@types/bapv'
import { Contact } from '../data/prisonerContactRegistryApiTypes'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import buildVisitorListItem from '../utils/visitorUtils'

type PrisonerContactRegistryApiClientBuilder = (token: string) => PrisonerContactRegistryApiClient

export default class PrisonerVisitorsService {
  constructor(
    private readonly prisonerContactRegistryApiClientBuilder: PrisonerContactRegistryApiClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  async getVisitors(offenderNo: string, username: string): Promise<VisitorListItem[]> {
    const token = await this.systemToken(username)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientBuilder(token)

    const allSocialContacts: Contact[] = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(offenderNo)
    const approvedContacts = allSocialContacts.filter(contact => contact.approvedVisitor)

    const visitorList: VisitorListItem[] = []
    approvedContacts.forEach(contact => {
      visitorList.push(buildVisitorListItem(contact))
    })

    return visitorList
  }
}
