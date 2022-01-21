import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Contact } from '../@types/bapv'
import config from '../config'
import socialContacts from './prisonerContactRegistryApiClient.data'

export const prisonerContactRegistryApiClientBuilder = (token: string): PrisonerContactRegistryApiClient => {
  const restClient = new RestClient('prisonerContactRegistryApi', config.apis.prisonerContactRegistry, token)
  const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(restClient)

  return prisonerContactRegistryApiClient
}

class PrisonerContactRegistryApiClient {
  constructor(private readonly restclient: RestClient) {}

  getPrisonerSocialContacts(offenderNo: string): Promise<Contact[]> {
    if (config.apis.prisonerContactRegistry.enabled) {
      return this.restclient.get({
        path: `/prisoners/${offenderNo}/contacts`,
        query: new URLSearchParams({
          type: 'S',
        }).toString(),
      })
    }

    return Promise.resolve(socialContacts)
  }
}

export default PrisonerContactRegistryApiClient
