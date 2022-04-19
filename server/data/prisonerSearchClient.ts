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

  private agencyId = 'HEI'

  private pageSize = config.apis.prisonerSearch.pageSize

  getPrisoners(search: string, page = 0): Promise<{ totalPages: number; totalElements: number; content: Prisoner[] }> {
    return this.restClient.post({
      path: '/keyword',
      data: {
        orWords: search,
        fuzzyMatch: true,
        prisonIds: [this.agencyId],
        pagination: {
          page,
          size: this.pageSize,
        },
      },
    })
  }

  getPrisoner(search: string): Promise<{ content: Prisoner[] }> {
    return this.restClient.post({
      path: '/keyword',
      data: {
        andWords: search,
        prisonIds: [this.agencyId],
      },
    })
  }
}

export default PrisonerSearchClient
