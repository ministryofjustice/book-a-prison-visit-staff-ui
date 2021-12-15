import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'

export default class PrisonerSearchClient {
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
