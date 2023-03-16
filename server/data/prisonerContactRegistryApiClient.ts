import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Contact } from './prisonerContactRegistryApiTypes'
import config from '../config'

export const prisonerContactRegistryApiClientBuilder = (token: string): PrisonerContactRegistryApiClient => {
  const restClient = new RestClient('prisonerContactRegistryApi', config.apis.prisonerContactRegistry, token)
  const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(restClient)

  return prisonerContactRegistryApiClient
}

class PrisonerContactRegistryApiClient {
  constructor(private readonly restclient: RestClient) {}

  async getPrisonerSocialContacts(offenderNo: string): Promise<Contact[]> {
    let socialContacts: Contact[] = []

    try {
      socialContacts = await this.restclient.get({
        path: `/prisoners/${offenderNo}/contacts`,
        query: new URLSearchParams({
          type: 'S',
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

export default PrisonerContactRegistryApiClient
