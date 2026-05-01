import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Contact } from './prisonerContactRegistryApiTypes'
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

  async getPrisonersApprovedSocialContacts(offenderNo: string): Promise<Contact[]> {
    try {
      const contacts = await this.restClient.get<Contact[]>({
        path: `/v2/prisoners/${offenderNo}/contacts/social/approved`,
        query: new URLSearchParams({
          hasDateOfBirth: 'false',
          withRestrictions: 'true',
        }).toString(),
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
