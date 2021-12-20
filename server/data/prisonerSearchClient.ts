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

  getPrisoners(search: string): Promise<{ content: Prisoner[] }> {
    return this.restClient.post({
      path: '/keyword',
      data: {
        orWords: search,
        fuzzyMatch: true,
        prisonIds: [this.agencyId],
      },
    })
  }
}

export default PrisonerSearchClient
