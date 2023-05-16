import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Visit, VisitSession, SessionCapacity, PageVisitDto, SessionSchedule } from './orchestrationApiTypes'
import config, { ApiConfig } from '../config'

export default class VisitSchedulerApiClient {
  private restClient: RestClient

  private visitType = 'SOCIAL'

  constructor(token: string) {
    this.restClient = new RestClient('visitSchedulerApiClient', config.apis.visitScheduler as ApiConfig, token)
  }

  // Workaround for pagination, mentioned in comments - VB-1760
  private page = '0'

  private size = '1000'

  async getVisit(reference: string): Promise<Visit> {
    return this.restClient.get({ path: `/visits/${reference}` })
  }

  async getUpcomingVisits(offenderNo: string, visitStatus: Visit['visitStatus'][]): Promise<PageVisitDto> {
    return this.restClient.get({
      path: '/visits/search',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        startDateTime: new Date().toISOString(),
        visitStatus: visitStatus.join(','),
        page: this.page,
        size: this.size,
      }).toString(),
    })
  }

  async getVisitsByDate(dateString: string, prisonId: string): Promise<PageVisitDto> {
    return this.restClient.get({
      path: '/visits/search',
      query: new URLSearchParams({
        prisonId,
        startDateTime: `${dateString}T00:00:00`,
        endDateTime: `${dateString}T23:59:59`,
        visitStatus: 'BOOKED',
        page: this.page,
        size: this.size,
      }).toString(),
    })
  }

  async getVisitSessions(offenderNo: string, prisonId: string): Promise<VisitSession[]> {
    return this.restClient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId,
        prisonerId: offenderNo,
        // 'min' and 'max' params omitted, so using API default between 2 and 28 days from now
      }).toString(),
    })
  }

  async getSessionSchedule(prisonId: string, date: string): Promise<SessionSchedule[]> {
    return this.restClient.get({
      path: '/visit-sessions/schedule',
      query: new URLSearchParams({
        prisonId,
        date,
      }).toString(),
    })
  }

  async getVisitSessionCapacity(
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
  ): Promise<SessionCapacity> {
    try {
      return await this.restClient.get({
        path: '/visit-sessions/capacity',
        query: new URLSearchParams({ prisonId, sessionDate, sessionStartTime, sessionEndTime }).toString(),
      })
    } catch (error) {
      return null
    }
  }
}
