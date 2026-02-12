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
      const contactDtos = await this.restClient.get<ContactDto[]>({
        path: `/v2/prisoners/${offenderNo}/contacts/social/approved`,
        query: new URLSearchParams({
          hasDateOfBirth: 'false',
          withAddress: 'true',
        }).toString(),
      })

      const contacts: Contact[] = contactDtos.map(contactDto => {
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
