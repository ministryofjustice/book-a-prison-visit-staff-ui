import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'

export default class PrisonerSearchClient {
  constructor(private readonly restClient: RestClient) {}

  private agencyId = 'HEI'

  getPrisoners(search: string): Promise<Prisoner[]> {
    return this.restClient.post({
      path: '/prisoner-search/match-prisoners',
      data: {
        prisonerIdentifier: search,
        firstName: search,
        lastName: search,
        prisonId: this.agencyId,
        includeAliases: false,
      },
    })
  }
}
