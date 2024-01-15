import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ApplicationMethodType,
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeVisitSlotRequestDto,
  NotificationCount,
  NotificationGroup,
  NotificationType,
  PageVisitDto,
  PrisonDto,
  PrisonerProfile,
  ReserveVisitSlotDto,
  SessionCapacity,
  SessionSchedule,
  SupportType,
  Visit,
  VisitHistoryDetails,
  VisitSession,
} from './orchestrationApiTypes'
import { VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient {
  private restClient: RestClient

  private visitType = 'SOCIAL'

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // Workaround for pagination, mentioned in comments - VB-1760
  private page = '0'

  private size = '1000'

  // orchestration-visits-controller

  async bookVisit(applicationReference: string, applicationMethod: ApplicationMethodType): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/book`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: applicationMethod,
      },
    })
  }

  async cancelVisit(reference: string, cancelVisitDto: CancelVisitOrchestrationDto): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${reference}/cancel`,
      data: cancelVisitDto,
    })
  }

  async changeBookedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/${visitSessionData.visitReference}/change`,
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
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

  async changeReservedVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
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
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
      },
    })
  }

  async reserveVisit(visitSessionData: VisitSessionData): Promise<Visit> {
    return this.restClient.post({
      path: '/visits/slot/reserve',
      data: <ReserveVisitSlotDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
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

  async getVisit(reference: string): Promise<Visit> {
    return this.restClient.get({ path: `/visits/${reference}` })
  }

  async getVisitHistory(reference: string): Promise<VisitHistoryDetails> {
    return this.restClient.get({ path: `/visits/${reference}/history` })
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

  async getAvailableSupportOptions(): Promise<SupportType[]> {
    return this.restClient.get({
      path: '/visit-support',
    })
  }

  // visit notification controller
  async getNotificationCount(prisonId: string): Promise<NotificationCount> {
    return this.restClient.get({ path: `/visits/notification/${prisonId}/count` })
  }

  async getNotificationGroups(prisonId: string): Promise<NotificationGroup[]> {
    return this.restClient.get({ path: `/visits/notification/${prisonId}/groups` })
  }

  async getVisitNotifications(reference: string): Promise<NotificationType[]> {
    return this.restClient.get({ path: `/visits/notification/visit/${reference}/types` })
  }

  // orchestration-sessions-controller

  async getVisitSessions(offenderNo: string, prisonId: string, minNumberOfDays?: string): Promise<VisitSession[]> {
    return this.restClient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId,
        prisonerId: offenderNo,
        min: minNumberOfDays,
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

  // prisoner-profile-controller

  async getPrisonerProfile(prisonId: string, prisonerId: string): Promise<PrisonerProfile> {
    return this.restClient.get({ path: `/prisoner/${prisonId}/${prisonerId}/profile` })
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.restClient.get({
      path: '/config/prisons/supported',
    })
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    return this.restClient.get({
      path: `/config/prisons/prison/${prisonCode}`,
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
