import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { ScheduledEvent } from './whereaboutsApiTypes'
import config from '../config'

export const whereaboutsApiClientBuilder = (token: string): WhereaboutsApiClient => {
  const restClient = new RestClient('whereaboutsApi', config.apis.whereabouts, token)
  const whereaboutsClient = new WhereaboutsApiClient(restClient)

  return whereaboutsClient
}

class WhereaboutsApiClient {
  constructor(private readonly restclient: RestClient) {}

  getEvents(offenderNo: string, fromDate: string, toDate: string): Promise<ScheduledEvent[]> {
    return this.restclient.get({
      path: `/events/${offenderNo}`,
      query: new URLSearchParams({
        fromDate,
        toDate,
      }).toString(),
    })
  }
}

export default WhereaboutsApiClient
