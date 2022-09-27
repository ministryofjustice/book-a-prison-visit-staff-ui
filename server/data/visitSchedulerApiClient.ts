import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  SupportType,
  Visit,
  VisitSession,
  OutcomeDto,
  ReserveVisitSlotDto,
  ChangeReservedVisitSlotRequestDto,
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

  reserveVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    return this.restclient.post({
      path: '/visits/slot/reserve',
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: this.prisonId,
        visitRoom: visitSessionData.visit.visitRoomName,
        visitType: this.visitType,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visit.startTimestamp,
        endTimestamp: visitSessionData.visit.endTimestamp,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }

  changeReservedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const visitContact = visitSessionData.mainContact
      ? {
          telephone: visitSessionData.mainContact.phoneNumber,
          name: visitSessionData.mainContact.contactName
            ? visitSessionData.mainContact.contactName
            : visitSessionData.mainContact.contact.name,
        }
      : undefined
    const mainContactId =
      visitSessionData.mainContact && visitSessionData.mainContact.contact
        ? visitSessionData.mainContact.contact.personId
        : null

    return this.restclient.put({
      path: `/visits/${visitSessionData.applicationReference}/slot/change`,
      data: <ChangeReservedVisitSlotRequestDto>{
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visit.startTimestamp,
        endTimestamp: visitSessionData.visit.endTimestamp,
        visitContact,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
            visitContact: visitor.personId === mainContactId,
          }
        }),
        visitorSupport: visitSessionData.visitorSupport,
      },
    })
  }

  bookVisit(applicationReference: string): Promise<Visit> {
    return this.restclient.put({ path: `/visits/${applicationReference}/book` })
  }

  cancelVisit(reference: string, outcome: OutcomeDto): Promise<Visit> {
    return this.restclient.put({
      path: `/visits/${reference}/cancel`,
      data: outcome,
    })
  }
}

export default VisitSchedulerApiClient
