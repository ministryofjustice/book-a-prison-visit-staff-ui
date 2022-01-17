import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { PrisonerVisit } from '../@types/bapv'
import config from '../config'

export const visitSchedulerApiClientBuilder = (token: string): VisitSchedulerApiClient => {
  const restClient = new RestClient('visitSchedulerApi', config.apis.visitScheduler, token)
  const visitSchedulerApiClient = new VisitSchedulerApiClient(restClient)

  return visitSchedulerApiClient
}

class VisitSchedulerApiClient {
  constructor(private readonly restclient: RestClient) {}

  private prisonId = 'HEI'

  getUpcomingVisits(offenderNo: string): Promise<PrisonerVisit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        prisonerId: offenderNo,
        startTimestamp: new Date().toISOString(),
      }).toString(),
    })
  }
}

export default VisitSchedulerApiClient
