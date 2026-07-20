import { URLSearchParams } from 'url'
import { RestClient as HmppsRestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config, { ApiConfig } from '../config'
import logger from '../../logger'

export default class PrisonerSearchClient {
  private readonly restClient: HmppsRestClient

  private pageSize = config.apis.prisonerSearch.pageSize

  constructor(private readonly token: string) {
    this.restClient = new HmppsRestClient('prisonerSearchApiClient', config.apis.prisonerSearch as ApiConfig, logger)
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    page = 0,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.restClient.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
          page: page.toString(),
          size: this.pageSize.toString(),
        }).toString(),
      },
      asUser(this.token),
    )
  }

  async getPrisoner(search: string, prisonId: string): Promise<{ content: Prisoner[] }> {
    return this.restClient.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: new URLSearchParams({
          term: search,
        }).toString(),
      },
      asUser(this.token),
    )
  }

  async getPrisonerById(id: string): Promise<Prisoner> {
    return this.restClient.get(
      {
        path: `/prisoner/${id}`,
      },
      asUser(this.token),
    )
  }
}
