import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ApplicationDto,
  ApplicationMethodType,
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  NotificationCount,
  NotificationGroup,
  NotificationType,
  PageVisitDto,
  PrisonDto,
  PrisonerProfile,
  SessionCapacity,
  SessionSchedule,
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

  async getVisit(reference: string): Promise<Visit> {
    return this.restClient.get({ path: `/visits/${reference}` })
  }

  async getVisitHistory(reference: string): Promise<VisitHistoryDetails> {
    return this.restClient.get({ path: `/visits/${reference}/history` })
  }

  async getVisitsByDate(dateString: string, prisonId: string): Promise<PageVisitDto> {
    return this.restClient.get({
      path: '/visits/search',
      query: new URLSearchParams({
        prisonId,
        visitStartDate: dateString,
        visitEndDate: dateString,
        visitStatus: 'BOOKED',
        page: this.page,
        size: this.size,
      }).toString(),
    })
  }

  //  orchestration-applications-controller

  async changeVisitApplication(visitSessionData: VisitSessionData): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/application/${visitSessionData.applicationReference}/slot/change`,
      data: <ChangeApplicationDto>{
        applicationRestriction: visitSessionData.visitRestriction,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        sessionDate: visitSessionData.visitSlot.startTimestamp.split('T')[0],
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

  async createVisitApplicationFromVisit(visitSessionData: VisitSessionData): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/application/${visitSessionData.visitReference}/change`,
      data: <ChangeApplicationDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        sessionDate: visitSessionData.visitSlot.startTimestamp.split('T')[0],
        applicationRestriction: visitSessionData.visitRestriction,
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

  async createVisitApplication(visitSessionData: VisitSessionData): Promise<ApplicationDto> {
    return this.restClient.post({
      path: '/visits/application/slot/reserve',
      data: <CreateApplicationDto>{
        prisonerId: visitSessionData.prisoner.offenderNo,
        sessionTemplateReference: visitSessionData.visitSlot.sessionTemplateReference,
        sessionDate: visitSessionData.visitSlot.startTimestamp.split('T')[0],
        applicationRestriction: visitSessionData.visitRestriction,
        visitors: visitSessionData.visitors.map(visitor => {
          return {
            nomisPersonId: visitor.personId,
          }
        }),
      },
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
    visitContact: ApplicationDto['visitContact']
    mainContactId: number
  } {
    const visitContact = mainContact
      ? {
          ...(mainContact.phoneNumber && { telephone: mainContact.phoneNumber }),
          name: mainContact.contactName ? mainContact.contactName : mainContact.contact.name,
        }
      : undefined
    const mainContactId = mainContact && mainContact.contact ? mainContact.contact.personId : null
    return { visitContact, mainContactId }
  }
}
