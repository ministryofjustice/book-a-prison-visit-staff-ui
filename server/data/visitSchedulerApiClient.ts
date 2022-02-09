import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Visit } from './visitSchedulerApiTypes'
import config from '../config'

export const visitSchedulerApiClientBuilder = (token: string): VisitSchedulerApiClient => {
  const restClient = new RestClient('visitSchedulerApi', config.apis.visitScheduler, token)
  const visitSchedulerApiClient = new VisitSchedulerApiClient(restClient)

  return visitSchedulerApiClient
}

class VisitSchedulerApiClient {
  constructor(private readonly restclient: RestClient) {}

  private prisonId = 'HEI'

  getUpcomingVisits(offenderNo: string, startTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        prisonerId: offenderNo,
        startTimestamp: startTimestamp || new Date().toISOString(),
      }).toString(),
    })
  }

  getPastVisits(offenderNo: string, endTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        prisonerId: offenderNo,
        endTimestamp: endTimestamp || new Date().toISOString(),
      }).toString(),
    })
  }
}

export default VisitSchedulerApiClient
