import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  CreateVisitRequestDto,
  SupportType,
  UpdateVisitRequestDto,
  Visit,
  VisitSession,
  OutcomeDto,
} from './visitSchedulerApiTypes'
import { VisitSessionData } from '../@types/bapv'
import config from '../config'

export const visitSchedulerApiClientBuilder = (token: string): VisitSchedulerApiClient => {
  const restClient = new RestClient('visitSchedulerApi', config.apis.visitScheduler, token)
  return new VisitSchedulerApiClient(restClient)
}

class VisitSchedulerApiClient {
  constructor(private readonly restclient: RestClient, private readonly prisonId = 'HEI') {}

  private visitType = 'SOCIAL'

  private visitStatus = 'BOOKED'

  getAvailableSupportOptions(): Promise<SupportType[]> {
    return this.restclient.get({
      path: '/visit-support',
    })
  }

  getVisit(reference: string): Promise<Visit> {
    return this.restclient.get({ path: `/visits/${reference}` })
  }

  getUpcomingVisits(offenderNo: string, startTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        prisonId: this.prisonId,
        startTimestamp: startTimestamp || new Date().toISOString(),
        visitStatus: this.visitStatus,
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
        visitStatus: this.visitStatus,
      }).toString(),
    })
  }

  getVisitsByDate(dateString?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        startTimestamp: `${dateString}T00:00:00`,
        endTimestamp: `${dateString}T23:59:59`,
        visitStatus: this.visitStatus,
      }).toString(),
    })
  }

  getVisitSessions(offenderNo: string): Promise<VisitSession[]> {
    return this.restclient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId: this.prisonId,
        prisonerId: offenderNo,
        // 'min' and 'max' params omitted, so using API default between 2 and 28 days from now
      }).toString(),
    })
  }

  reserveVisit(visitData: VisitSessionData): Promise<Visit> {
    return this.restclient.post({
      path: '/visits',
      data: <CreateVisitRequestDto>{
        prisonerId: visitData.prisoner.offenderNo,
        prisonId: this.prisonId,
        visitRoom: visitData.visit.visitRoomName,
        visitType: this.visitType,
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
    const mainContactId =
      visitData.mainContact && visitData.mainContact.contact ? visitData.mainContact.contact.personId : null

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
            visitContact: visitor.personId === mainContactId,
          }
        }),
        visitorSupport: visitData.visitorSupport,
      },
    })
  }

  cancelVisit(reference: string, outcome: OutcomeDto): Promise<Visit> {
    return this.restclient.patch({
      path: `/visits/${reference}/cancel`,
      data: outcome,
    })
  }
}

export default VisitSchedulerApiClient
