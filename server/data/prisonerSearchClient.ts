import RestClient from './restClient'
import { Prisoner } from './prisonerOffenderSearchTypes'

export default class PrisonerSearchClient {
  constructor(private readonly restClient: RestClient) {}

  private agencyId = 'HEI'

  getPrisoners(search: string): Promise<{ matches: { prisoner: Prisoner }[] }> {
    return this.restClient.post({
      path: '/match-prisoners',
      data: {
        firstName: search,
        lastName: search,
        prisonerIdentifier: search,
        prisonIds: [this.agencyId],
      },
    })
  }
}
