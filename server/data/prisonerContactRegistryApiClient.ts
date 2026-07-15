import { URLSearchParams } from 'url'
import { type AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { Contact } from './prisonerContactRegistryApiTypes'
import config from '../config'
import logger from '../../logger'

type GetRequest = Parameters<RestClient['get']>[0]

export default class PrisonerContactRegistryApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonerContactRegistryApiClient', config.apis.prisonerContactRegistry, logger, authenticationClient)
  }

  private static getStatus(error: { status?: number; responseStatus?: number }): number | undefined {
    return error.status ?? error.responseStatus
  }

  private systemGet<Response = unknown>(request: GetRequest): Promise<Response> {
    return this.get(request, asSystem()) as Promise<Response>
  }

  async getPrisonersApprovedSocialContacts(offenderNo: string): Promise<Contact[]> {
    try {
      const contacts = await this.systemGet<Contact[]>({
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
