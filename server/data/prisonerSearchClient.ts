import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config, { ApiConfig } from '../config'

export default class PrisonerSearchClient {
  private restClient: RestClient

  private pageSize = config.apis.prisonerSearch.pageSize

  constructor(token: string) {
    this.restClient = new RestClient('prisonerSearchApiClient', config.apis.prisonerSearch as ApiConfig, token)
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
