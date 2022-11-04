import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  SupportType,
  Visit,
  VisitSession,
  OutcomeDto,
  ReserveVisitSlotDto,
  ChangeVisitSlotRequestDto,
} from './visitSchedulerApiTypes'
import { VisitSessionData } from '../@types/bapv'
import config from '../config'

export const visitSchedulerApiClientBuilder = (token: string): VisitSchedulerApiClient => {
  const restClient = new RestClient('visitSchedulerApi', config.apis.visitScheduler, token)
  return new VisitSchedulerApiClient(restClient)
}

class VisitSchedulerApiClient {
  constructor(private readonly restclient: RestClient) {}

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

  getUpcomingVisits(offenderNo: string, prisonId: string, startTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        prisonId, // @TODO won't need this once VB-1403 resolved
        startTimestamp: startTimestamp || new Date().toISOString(),
        visitStatus: this.visitStatus,
      }).toString(),
    })
  }

  getPastVisits(offenderNo: string, prisonId: string, endTimestamp?: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        prisonId, // @TODO won't need this once VB-1403 resolved
        endTimestamp: endTimestamp || new Date().toISOString(),
        visitStatus: this.visitStatus,
      }).toString(),
    })
  }

  getVisitsByDate(dateString: string, prisonId: string): Promise<Visit[]> {
    return this.restclient.get({
      path: '/visits',
      query: new URLSearchParams({
        prisonId,
        startTimestamp: `${dateString}T00:00:00`,
        endTimestamp: `${dateString}T23:59:59`,
        visitStatus: this.visitStatus,
      }).toString(),
    })
  }

  getVisitSessions(offenderNo: string, prisonId: string): Promise<VisitSession[]> {
    return this.restclient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId,
        prisonerId: offenderNo,
        // 'min' and 'max' params omitted, so using API default between 2 and 28 days from now
      }).toString(),
    })
  }

  reserveVisit(visitSessionData: VisitSessionData, prisonId: string): Promise<Visit> {
    return this.restclient.post({
      path: '/visits/slot/reserve',
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType: this.visitType,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
    })
  }

  changeReservedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restclient.put({
      path: `/visits/${visitSessionData.applicationReference}/slot/change`,
      data: <ChangeVisitSlotRequestDto>{
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
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

  changeBookedVisit(visitSessionData: VisitSessionData, prisonId: string): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restclient.put({
      path: `/visits/${visitSessionData.visitReference}/change`,
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId,
        visitRoom: visitSessionData.visitSlot.visitRoomName,
        visitType: this.visitType,
        visitRestriction: visitSessionData.visitRestriction,
        startTimestamp: visitSessionData.visitSlot.startTimestamp,
        endTimestamp: visitSessionData.visitSlot.endTimestamp,
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

  cancelVisit(reference: string, outcome: OutcomeDto): Promise<Visit> {
    return this.restclient.put({
      path: `/visits/${reference}/cancel`,
      data: outcome,
    })
  }

  private convertMainContactToVisitContact(mainContact: VisitSessionData['mainContact']): {
    visitContact: ReserveVisitSlotDto['visitContact']
    mainContactId: number
  } {
    const visitContact = mainContact
      ? {
          telephone: mainContact.phoneNumber,
          name: mainContact.contactName ? mainContact.contactName : mainContact.contact.name,
        }
      : undefined
    const mainContactId = mainContact && mainContact.contact ? mainContact.contact.personId : null

    return { visitContact, mainContactId }
  }
}

export default VisitSchedulerApiClient
