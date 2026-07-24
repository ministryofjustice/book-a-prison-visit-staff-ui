import { URLSearchParams } from 'url'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { Prisoner } from './prisonerOffenderSearchTypes'

export default class PrisonerSearchClient extends RestClient {
  private pageSize = config.apis.prisonerSearch.pageSize

  constructor(authenticationClient: AuthenticationClient) {
    super('prisonerSearchApiClient', config.apis.prisonerSearch, logger, authenticationClient)
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    username: string,
    page = 0,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
          page: page.toString(),
          size: this.pageSize.toString(),
        }).toString(),
      },
      asSystem(username),
    )
  }

  async getPrisoner(search: string, prisonId: string, username: string): Promise<{ content: Prisoner[] }> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
        }).toString(),
      },
      asSystem(username),
    )
  }

  async getPrisonerById(id: string, username: string): Promise<Prisoner> {
    return this.get(
      {
        path: `/prisoner/${id}`,
      },
      asSystem(username),
    )
  }
}
