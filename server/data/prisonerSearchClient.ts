import { URLSearchParams } from 'url'
import { type AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config from '../config'
import logger from '../../logger'

type GetRequest = Parameters<RestClient['get']>[0]

export default class PrisonerSearchClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonerSearchApiClient', config.apis.prisonerSearch, logger, authenticationClient)
  }

  private pageSize = config.apis.prisonerSearch.pageSize

  private systemGet<Response = unknown>(request: GetRequest): Promise<Response> {
    return this.get(request, asSystem()) as Promise<Response>
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    page = 0,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.systemGet({
      path: `/prison/${prisonId}/prisoners`,
      query: new URLSearchParams({
        term: search,
        page: page.toString(),
        size: this.pageSize.toString(),
      }).toString(),
    })
  }

  async getPrisoner(search: string, prisonId: string): Promise<{ content: Prisoner[] }> {
    return this.systemGet({
      path: `/prison/${prisonId}/prisoners`,
      query: new URLSearchParams({
        term: search,
      }).toString(),
    })
  }

  async getPrisonerById(id: string): Promise<Prisoner> {
    return this.systemGet({
      path: `/prisoner/${id}`,
    })
  }
}
