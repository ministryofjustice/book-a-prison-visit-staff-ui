import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'
import config from '../config'

export const prisonerSearchClientBuilder = (token: string): PrisonerSearchClient => {
  const restClient = new RestClient('prisonerSearchApi', config.apis.prisonerSearch, token)
  const prisonerSearchClient = new PrisonerSearchClient(restClient)

  return prisonerSearchClient
}

class PrisonerSearchClient {
  constructor(private readonly restClient: RestClient) {}

  private pageSize = config.apis.prisonerSearch.pageSize

  getPrisoners(
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

  getPrisoner(search: string, prisonId: string): Promise<{ content: Prisoner[] }> {
    return this.restClient.get({
      path: `/prison/${prisonId}/prisoners`,
      query: new URLSearchParams({
        term: search,
      }).toString(),
    })
  }

  getPrisonerById(id: string): Promise<Prisoner> {
    return this.restClient.get({
      path: `/prisoner/${id}`,
    })
  }

  async getPrisonersByPrisonerNumbers(
    prisonerNumbers: string[],
    page = 0,
  ): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    const allResults: Prisoner[] = await this.restClient.post({
      path: '/prisoner-search/prisoner-numbers',
      data: {
        prisonerNumbers,
      },
    })

    const totalElements = allResults.length
    const totalPages = Math.ceil(totalElements / this.pageSize)
    let actualPage = 1

    if (page >= 0 && page < totalPages) {
      actualPage = page + 1
    }

    const startIndex = (actualPage - 1) * this.pageSize

    return {
      totalPages,
      totalElements,
      content: allResults.slice(startIndex, startIndex + this.pageSize),
    }
  }
}

export default PrisonerSearchClient
