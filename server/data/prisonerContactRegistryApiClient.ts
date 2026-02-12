import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Contact, ContactDto } from './prisonerContactRegistryApiTypes'
import config, { ApiConfig } from '../config'

export default class PrisonerContactRegistryApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'prisonerContactRegistryApiClient',
      config.apis.prisonerContactRegistry as ApiConfig,
      token,
    )
  }

  // TODO remove mapping from ContactDto => Contact in VB-6423
  async getPrisonersApprovedSocialContacts(offenderNo: string): Promise<Contact[]> {
    try {
      const rawContacts = await this.restClient.get<ContactDto[] | Contact[]>({
        path: `/v2/prisoners/${offenderNo}/contacts/social/approved`,
        query: new URLSearchParams({
          hasDateOfBirth: 'false',
          withAddress: 'true',
        }).toString(),
      })

      // If 'addresses' not present; new API data format received so just return
      if (rawContacts.length === 0 || !Object.hasOwn(rawContacts[0], 'addresses')) {
        return rawContacts as Contact[]
      }

      // Old API data format, so process to map primary/first of 'addresses' to 'address
      const contacts: Contact[] = (rawContacts as ContactDto[]).map(contactDto => {
        const { addresses, ...allOtherProperties } = contactDto

        const address = addresses.find(a => a.primary) || addresses[0] || { primary: false, noFixedAddress: false }
        return { ...allOtherProperties, address }
      })

      return contacts
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }

      return []
    }
  }
}
