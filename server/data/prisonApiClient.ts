import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  InmateDetail,
  PagePrisonerBookingSummary,
  VisitBalances,
  OffenderRestrictions,
  CaseLoad,
} from './prisonApiTypes'
import config from '../config'

export const prisonApiClientBuilder = (token: string): PrisonApiClient => {
  const restClient = new RestClient('prisonApi', config.apis.prison, token)
  const prisonClient = new PrisonApiClient(restClient)

  return prisonClient
}

class PrisonApiClient {
  constructor(private readonly restclient: RestClient) {}

  getBookings(offenderNo: string, prisonId: string): Promise<PagePrisonerBookingSummary> {
    return this.restclient.get({
      path: '/api/bookings/v2',
      query: new URLSearchParams({
        prisonId,
        offenderNo,
        legalInfo: 'true',
      }).toString(),
    })
  }

  getOffender(offenderNo: string): Promise<InmateDetail> {
    return this.restclient.get({
      path: `/api/offenders/${offenderNo}`,
    })
  }

  getOffenderRestrictions(offenderNo: string): Promise<OffenderRestrictions> {
    return this.restclient.get({
      path: `/api/offenders/${offenderNo}/offender-restrictions`,
      query: new URLSearchParams({ activeRestrictionsOnly: 'true' }).toString(),
    })
  }

  getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.restclient.get({
      path: '/api/users/me/caseLoads',
    })
  }

  async setActiveCaseLoad(caseLoadId: string): Promise<void> {
    return this.restclient.put({
      path: '/api/users/me/activeCaseLoad',
      data: { caseLoadId },
    })
  }

  async getVisitBalances(offenderNo: string): Promise<VisitBalances | null> {
    try {
      return await this.restclient.get({
        path: `/api/bookings/offenderNo/${offenderNo}/visit/balances`,
      })
    } catch (error) {
      // the endpoint returns 404 for some offenders (e.g. on remand) that
      // have no visit balances record. Return null in these cases
      if (error.status !== 404) {
        throw error
      }
    }
    return null
  }
}

export default PrisonApiClient
