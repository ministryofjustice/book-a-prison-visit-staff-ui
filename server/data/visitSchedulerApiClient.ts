import { URLSearchParams } from 'url'
import RestClient from './restClient'
import {
  SupportType,
  Visit,
  VisitSession,
  OutcomeDto,
  ReserveVisitSlotDto,
  ChangeVisitSlotRequestDto,
  SessionCapacity,
  PageVisitDto,
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

  // Workaround for pagination, mentioned in comments - VB-1760
  private page = '0'

  private size = '1000'

  getSupportedPrisonIds(): Promise<string[]> {
    return this.restclient.get({
      path: '/config/prisons/supported',
    })
  }

  getAvailableSupportOptions(): Promise<SupportType[]> {
    return this.restclient.get({
      path: '/visit-support',
    })
  }

  getVisit(reference: string): Promise<Visit> {
    return this.restclient.get({ path: `/visits/${reference}` })
  }

  getUpcomingVisits(offenderNo: string, visitStatus: Visit['visitStatus'][]): Promise<PageVisitDto> {
    return this.restclient.get({
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

  getPastVisits(offenderNo: string, visitStatus: Visit['visitStatus'][], endTimestamp?: string): Promise<PageVisitDto> {
    return this.restclient.get({
      path: '/visits/search',
      query: new URLSearchParams({
        prisonerId: offenderNo,
        endDateTime: endTimestamp || new Date().toISOString(),
        visitStatus: visitStatus.join(','),
        page: this.page,
        size: this.size,
      }).toString(),
    })
  }

  getVisitsByDate(dateString: string, prisonId: string): Promise<PageVisitDto> {
    return this.restclient.get({
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

  getVisitSchedule(prisonId: string, sessionDate: string) {
    return this.restclient.get({
      path: '/visit-sessions/schedule',
      query: new URLSearchParams({
        prisonId,
        sessionDate,
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
      return await this.restclient.get({
        path: '/visit-sessions/capacity',
        query: new URLSearchParams({ prisonId, sessionDate, sessionStartTime, sessionEndTime }).toString(),
      })
    } catch (error) {
      return null
    }
  }

  reserveVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    return this.restclient.post({
      path: '/visits/slot/reserve',
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: visitSessionData.visitSlot.prisonId,
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

  changeBookedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restclient.put({
      path: `/visits/${visitSessionData.visitReference}/change`,
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        prisonId: visitSessionData.visitSlot.prisonId,
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
