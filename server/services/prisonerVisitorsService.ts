import { VisitorListItem } from '../@types/bapv'
import { buildVisitorListItem } from '../utils/visitorUtils'
import { PrisonerContactRegistryApiClient } from '../data'

export default class PrisonerVisitorsService {
  constructor(private readonly prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient) {}

  async getVisitors(offenderNo: string, policyNoticeDaysMax: number): Promise<VisitorListItem[]> {
    const socialContacts = await this.prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

    const visitorList: VisitorListItem[] = []
    socialContacts.forEach(contact => {
      visitorList.push(buildVisitorListItem(contact, policyNoticeDaysMax))
    })

    return visitorList
  }
}
