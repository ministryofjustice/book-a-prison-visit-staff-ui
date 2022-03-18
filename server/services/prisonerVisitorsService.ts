import { SystemToken, VisitorListItem } from '../@types/bapv'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import PrisonerContactRegistryApiClient from '../data/prisonerContactRegistryApiClient'
import { isAdult } from '../utils/utils'

type PrisonerContactRegistryApiClientBuilder = (token: string) => PrisonerContactRegistryApiClient

export default class PrisonerVisitorsService {
  private visitorRestrictionsToShow = ['BAN', 'PREINF', 'RESTRICTED', 'CLOSED', 'NONCON']

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
      const visitor: VisitorListItem = {
        personId: contact.personId,
        name: `${contact.firstName} ${contact.lastName}`,
        dateOfBirth: contact.dateOfBirth,
        adult: contact.dateOfBirth ? isAdult(contact.dateOfBirth) : undefined,
        relationshipDescription: contact.relationshipDescription,
        address: this.getAddressToDisplay(contact.addresses),
        restrictions: this.getRestrictionsToDisplay(contact.restrictions),
        selected: false,
        banned: this.isBanned(contact.restrictions),
      }
      visitorList.push(visitor)
    })

    return visitorList
  }

  private getAddressToDisplay(addresses: Address[]): string {
    if (addresses.length === 0) return 'Not entered'

    const primaryAddress = addresses.find(address => address.primary)
    return this.getFormattedAddress(primaryAddress || addresses[0])
  }

  private getFormattedAddress(address: Address): string {
    const flat = address.flat && `Flat ${address.flat}`
    const formattedAddress = [
      address.premise,
      flat,
      address.street,
      address.locality,
      address.town,
      address.county,
      address.postalCode,
      address.country,
    ]
      .filter(value => value)
      .join(',<br>')

    return formattedAddress
  }

  private getRestrictionsToDisplay(restrictions: Restriction[]): Restriction[] {
    return restrictions.filter(restriction => this.visitorRestrictionsToShow.includes(restriction.restrictionType))
  }

  private isBanned(restrictions: Restriction[]): boolean {
    return !!restrictions.find(restriction => restriction.restrictionType === 'BAN')
  }
}
