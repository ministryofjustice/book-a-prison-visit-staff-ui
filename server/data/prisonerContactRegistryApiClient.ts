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

  async getPrisonerSocialContacts(approvedVisitorsOnly: boolean, offenderNo: string): Promise<Contact[]> {
    let socialContacts: Contact[] = []

    try {
      socialContacts = await this.restClient.get({
        path: `/prisoners/${offenderNo}/contacts/social`,
        query: new URLSearchParams({
          approvedVisitorsOnly: approvedVisitorsOnly.toString(),
          hasDateOfBirth: 'false',
          withAddress: 'true',
        }).toString(),
      })
    } catch (e) {
      if (e.status !== 404) {
        throw e
      }
    }

    return socialContacts
  }
}
