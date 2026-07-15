import { URLSearchParams } from 'url'
import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import { Contact } from './prisonerContactRegistryApiTypes'
import config from '../config'
import logger from '../../logger'

export default class PrisonerContactRegistryApiClient {
  private restClient: Pick<RestClient, 'get'>

  private static getStatus(error: { status?: number; responseStatus?: number }): number | undefined {
    return error.status ?? error.responseStatus
  }

  constructor(token: string) {
    const client = new RestClient('prisonerContactRegistryApiClient', config.apis.prisonerContactRegistry, logger)
    this.restClient = {
      get: (request, authOptions) => client.get(request, authOptions ?? asUser(token)),
    }
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
      if (PrisonerContactRegistryApiClient.getStatus(error as { status?: number; responseStatus?: number }) !== 404) {
        throw error
      }

      return []
    }
  }
}
