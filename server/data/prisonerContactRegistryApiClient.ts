import { URLSearchParams } from 'url'
import { RestClient as HmppsRestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import { Contact } from './prisonerContactRegistryApiTypes'
import config, { ApiConfig } from '../config'
import logger from '../../logger'
import { getErrorStatus } from '../utils/errorHelpers'

export default class PrisonerContactRegistryApiClient {
  private readonly restClient: HmppsRestClient

  constructor(private readonly token: string) {
    this.restClient = new HmppsRestClient(
      'prisonerContactRegistryApiClient',
      config.apis.prisonerContactRegistry as ApiConfig,
      logger,
    )
  }

  async getPrisonersApprovedSocialContacts(offenderNo: string): Promise<Contact[]> {
    try {
      const contacts = await this.restClient.get<Contact[]>(
        {
          path: `/v2/prisoners/${offenderNo}/contacts/social/approved`,
          query: new URLSearchParams({
            hasDateOfBirth: 'false',
            withRestrictions: 'true',
          }).toString(),
        },
        asUser(this.token),
      )

      return contacts
    } catch (error) {
      if (getErrorStatus(error) !== 404) {
        throw error
      }

      return []
    }
  }
}
