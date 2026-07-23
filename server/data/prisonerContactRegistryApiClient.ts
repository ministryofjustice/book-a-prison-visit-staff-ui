import { URLSearchParams } from 'url'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { Contact } from './prisonerContactRegistryApiTypes'

export default class PrisonerContactRegistryApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonerContactRegistryApiClient', config.apis.prisonerContactRegistry, logger, authenticationClient)
  }

  async getPrisonersApprovedSocialContacts(offenderNo: string, username: string): Promise<Contact[]> {
    try {
      const contacts = await this.get<Contact[]>(
        {
          path: `/v2/prisoners/${offenderNo}/contacts/social/approved`,
          query: new URLSearchParams({
            hasDateOfBirth: 'false',
            withRestrictions: 'true',
          }).toString(),
        },
        asSystem(username),
      )

      return contacts
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }

      return []
    }
  }
}
