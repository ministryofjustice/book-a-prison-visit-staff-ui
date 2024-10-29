import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { OffenderRestrictions } from './prisonApiTypes'
import config, { ApiConfig } from '../config'

export default class PrisonApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('prisonApiClient', config.apis.prison as ApiConfig, token)
  }

  async getOffenderRestrictions(offenderNo: string): Promise<OffenderRestrictions> {
    return this.restClient.get({
      path: `/api/offenders/${offenderNo}/offender-restrictions`,
      query: new URLSearchParams({ activeRestrictionsOnly: 'true' }).toString(),
    })
  }
}
