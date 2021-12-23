import RestClient from './restClient'
import { InmateDetail, VisitBalances } from './prisonApiTypes'
import config from '../config'

export const prisonApiClientBuilder = (token: string): PrisonApiClient => {
  const restClient = new RestClient('prisonApi', config.apis.prison, token)
  const prisonClient = new PrisonApiClient(restClient)

  return prisonClient
}

class PrisonApiClient {
  constructor(private readonly restclient: RestClient) {}

  getOffender(offenderNo: string): Promise<InmateDetail> {
    return this.restclient.get({
      path: `/api/offenders/${offenderNo}`,
    })
  }

  async getVisitBalances(offenderNo: string): Promise<VisitBalances | null> {
    let balances: VisitBalances
    try {
      balances = await this.restclient.get({
        path: `/api/bookings/offenderNo/${offenderNo}/visit/balances`,
      })
    } catch (error) {
      // the endpoint returns 404 for some offenders (e.g. on remand) that
      // have no visit balances record. Return null in these cases
      if (error.status !== 404) {
        throw error
      }
    }
    return balances || null
  }
}

export default PrisonApiClient
