import RestClient from './restClient'

export default class PrisonerSearchClient {
  constructor(private readonly restClient: RestClient) {}

  private agencyId = 'HEI'

  getPrisoners(search: string): Promise<any> {
    return this.restClient.post({
      path: `/prisoner-search/match-prisoners`,
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
