import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  CreateVisitRequestDto,
  SupportType,
  UpdateVisitRequestDto,
  Visit,
  VisitSession,
} from './visitSchedulerApiTypes'
import { VisitSessionData } from '../@types/bapv'
import config from '../config'

export const visitSchedulerApiClientBuilder = (token: string): VisitSchedulerApiClient => {
  const restClient = new RestClient('visitSchedulerApi', config.apis.visitScheduler, token)
  const visitSchedulerApiClient = new VisitSchedulerApiClient(restClient)

  return visitSchedulerApiClient
}

class VisitSchedulerApiClient {
  constructor(private readonly restclient: RestClient) {}

  private prisonId = 'HEI'

  private visitType = 'SOCIAL'

  getAvailableSupportOptions(): Promise<SupportType[]> {
    return this.restclient.get({
      path: '/visit-support',
    })
  }

  getUpcomingVisits(offenderNo: string, startTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        prisonId: this.prisonId,
        startTimestamp: startTimestamp || new Date().toISOString(),
      }).toString(),
    })
  }

  getPastVisits(offenderNo: string, endTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        prisonId: this.prisonId,
        endTimestamp: endTimestamp || new Date().toISOString(),
      }).toString(),
    })
  }

  getVisitSessions(): Promise<VisitSession[]> {
    return this.restclient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        // 'min' and 'max' params omitted, so using API default between 2 and 28 days from now
      }).toString(),
    })
  }

  createVisit(visitData: VisitSessionData): Promise<Visit> {
    return this.restclient.post({
      path: '/visits',
      data: <CreateVisitRequestDto>{
        prisonerId: visitData.prisoner.offenderNo,
        prisonId: this.prisonId,
        visitRoom: visitData.visit.visitRoomName,
        visitType: this.visitType,
        visitStatus: 'RESERVED',
        visitRestriction: visitData.visitRestriction,
        startTimestamp: visitData.visit.startTimestamp,
        endTimestamp: visitData.visit.endTimestamp,
        visitors: visitData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }

  updateVisit(visitData: VisitSessionData, visitStatus: string): Promise<Visit> {
    const visitContact = visitData.mainContact
      ? {
          telephone: visitData.mainContact.phoneNumber,
          name: visitData.mainContact.contactName
            ? visitData.mainContact.contactName
            : visitData.mainContact.contact.name,
        }
      : undefined

    return this.restclient.put({
      path: `/visits/${visitData.visitReference}`,
      data: <UpdateVisitRequestDto>{
        prisonerId: visitData.prisoner.offenderNo,
        prisonId: this.prisonId,
        visitRoom: visitData.visit.visitRoomName,
        visitType: this.visitType,
        visitStatus,
        visitRestriction: visitData.visitRestriction,
        startTimestamp: visitData.visit.startTimestamp,
        endTimestamp: visitData.visit.endTimestamp,
        visitContact,
        visitors: visitData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
        visitorSupport: visitData.visitorSupport,
      },
    })
  }
}

export default VisitSchedulerApiClient
