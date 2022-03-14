import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Visit, VisitSession } from './visitSchedulerApiTypes'
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

  private visitType = 'STANDARD_SOCIAL'

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
      data: {
        prisonId: this.prisonId,
        prisonerId: visitData.prisoner.offenderNo,
        startTimestamp: visitData.visit.startTimestamp,
        endTimestamp: visitData.visit.endTimestamp,
        visitType: this.visitType,
        visitStatus: 'RESERVED',
        visitRoom: visitData.visit.visitRoomName,
        contactList: visitData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }

  updateVisit(visitData: VisitSessionData, visitStatus: string): Promise<Visit> {
    const mainContact = {
      contactPhone: visitData.mainContact.phoneNumber,
      contactName: visitData.mainContact.contactName
        ? visitData.mainContact.contactName
        : visitData.mainContact.contact.name,
    }
    const additionalSupport = visitData.additionalSupport?.keys
      ? visitData.additionalSupport.keys.concat([visitData.additionalSupport.other]).join(',')
      : ''

    return this.restclient.put({
      path: `/visits/${visitData.reservationId}`,
      data: {
        prisonId: this.prisonId,
        prisonerId: visitData.prisoner.offenderNo,
        startTimestamp: visitData.visit.startTimestamp,
        endTimestamp: visitData.visit.endTimestamp,
        visitType: this.visitType,
        visitStatus,
        visitRoom: visitData.visit.visitRoomName,
        reasonableAdjustments: additionalSupport,
        mainContact,
        contactList: visitData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }
}

export default VisitSchedulerApiClient
