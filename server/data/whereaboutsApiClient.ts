import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { ScheduledEvent } from './whereaboutsApiTypes'
import config, { ApiConfig } from '../config'

export default class WhereaboutsApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('whereaboutsApiClient', config.apis.whereabouts as ApiConfig, token)
  }

  async getEvents(offenderNo: string, fromDate: string, toDate: string): Promise<ScheduledEvent[]> {
    return this.restClient.get({
      path: `/events/${offenderNo}`,
      query: new URLSearchParams({
        fromDate,
        toDate,
      }).toString(),
    })
  }
}
