import { URLSearchParams } from 'url'
import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config from '../config'
import logger from '../../logger'

export default class PrisonerSearchClient {
  private restClient: Pick<RestClient, 'get'>

  private pageSize = config.apis.prisonerSearch.pageSize

  constructor(token: string) {
    const client = new RestClient('prisonerSearchApiClient', config.apis.prisonerSearch, logger)
    this.restClient = {
      get: (request, authOptions) => client.get(request, authOptions ?? asUser(token)),
    }
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    page = 0,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.restClient.get({
      path: `/prison/${prisonId}/prisoners`,
      query: new URLSearchParams({
        term: search,
        page: page.toString(),
        size: this.pageSize.toString(),
      }).toString(),
    })
  }

  async getPrisoner(search: string, prisonId: string): Promise<{ content: Prisoner[] }> {
    return this.restClient.get({
      path: `/prison/${prisonId}/prisoners`,
      query: new URLSearchParams({
        term: search,
      }).toString(),
    })
  }

  async getPrisonerById(id: string): Promise<Prisoner> {
    return this.restClient.get({
      path: `/prisoner/${id}`,
    })
  }
}
