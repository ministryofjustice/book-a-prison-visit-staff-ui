import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  InmateDetail,
  PagePrisonerBookingSummary,
  VisitBalances,
  OffenderRestrictions,
  CaseLoad,
} from './prisonApiTypes'
import config, { ApiConfig } from '../config'

export default class PrisonApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('prisonApiClient', config.apis.prison as ApiConfig, token)
  }

  async getBookings(offenderNo: string, prisonId: string): Promise<PagePrisonerBookingSummary> {
    return this.restClient.get({
      path: '/api/bookings/v2',
      query: new URLSearchParams({
        prisonId,
        offenderNo,
        legalInfo: 'true',
      }).toString(),
    })
  }

  async getOffender(offenderNo: string): Promise<InmateDetail> {
    return this.restClient.get({
      path: `/api/offenders/${offenderNo}`,
    })
  }

  async getOffenderRestrictions(offenderNo: string): Promise<OffenderRestrictions> {
    return this.restClient.get({
      path: `/api/offenders/${offenderNo}/offender-restrictions`,
      query: new URLSearchParams({ activeRestrictionsOnly: 'true' }).toString(),
    })
  }

  async getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.restClient.get({
      path: '/api/users/me/caseLoads',
    })
  }

  async setActiveCaseLoad(caseLoadId: string): Promise<void> {
    return this.restClient.put({
      path: '/api/users/me/activeCaseLoad',
      data: { caseLoadId },
    })
  }

  async getVisitBalances(offenderNo: string): Promise<VisitBalances | null> {
    try {
      return await this.restClient.get({
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
