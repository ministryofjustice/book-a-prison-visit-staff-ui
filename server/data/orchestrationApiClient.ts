import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ApplicationDto,
  ApplicationMethodType,
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  IgnoreVisitNotificationsDto,
  IsExcludeDateDto,
  NotificationCount,
  NotificationGroup,
  PageVisitDto,
  PrisonDto,
  PrisonerProfile,
  ExcludeDateDto,
  SessionCapacity,
  SessionSchedule,
  Visit,
  VisitPreview,
  VisitRestriction,
  VisitSession,
  EventAuditType,
  VisitBookingDetailsDto,
} from './orchestrationApiTypes'
import { Prison, VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient {
  private restClient: RestClient

  private visitType = 'SOCIAL'

  private enabledNotifications = config.features.notificationTypes.enabledNotifications

  private enabledVisitHistoryEvents: EventAuditType[] = [
    'RESERVED_VISIT',
    'CHANGING_VISIT',
    'MIGRATED_VISIT',
    'BOOKED_VISIT',
    'UPDATED_VISIT',
    'CANCELLED_VISIT',
    'IGNORE_VISIT_NOTIFICATIONS_EVENT',
    ...this.enabledNotifications,
  ]

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // orchestration-visits-controller

  async bookVisit(
    applicationReference: string,
    applicationMethod: ApplicationMethodType,
    allowOverBooking: boolean,
    username: string,
  ): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/book`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: applicationMethod,
        allowOverBooking,
        actionedBy: username,
        userType: 'STAFF',
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

  async getVisitDetailed(reference: string): Promise<VisitBookingDetailsDto> {
    const visitDetails = await this.restClient.get<VisitBookingDetailsDto>({
      path: `/visits/${reference}/detailed`,
    })

    visitDetails.events = visitDetails.events.filter(event => this.enabledVisitHistoryEvents.includes(event.type))
    visitDetails.notifications = visitDetails.notifications.filter(notification =>
      this.enabledNotifications.includes(notification.type),
    )

    return visitDetails
  }

  async getVisitsBySessionTemplate(
    prisonId: string,
    reference: string,
    sessionDate: string,
    visitRestrictions: VisitRestriction[],
  ): Promise<VisitPreview[]> {
    return this.restClient.get({
      path: '/visits/session-template',
      query: new URLSearchParams({
        prisonCode: prisonId,
        ...(reference && { sessionTemplateReference: reference }),
        sessionDate,
        visitStatus: 'BOOKED',
        ...(visitRestrictions && { visitRestrictions }),
      }).toString(),
    })
  }

  async getBookedVisitCountByDate(prisonId: string, date: string): Promise<number> {
    const visits = await this.restClient.get<PageVisitDto>({
      path: `/visits/search`,
      query: new URLSearchParams({
        prisonId,
        visitStartDate: date,
        visitEndDate: date,
        visitStatus: 'BOOKED',
        page: '0',
        size: '1',
      }).toString(),
    })
    return visits.totalElements ?? 0
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
        allowOverBooking: true,
      },
    })
  }

  async createVisitApplicationFromVisit(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put({
      path: `/visits/application/${visitSessionData.visitReference}/change`,
      data: <CreateApplicationDto>{
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
        userType: 'STAFF',
        actionedBy: username,
        allowOverBooking: true,
      },
    })
  }

  async createVisitApplication(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
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
        userType: 'STAFF',
        actionedBy: username,
        allowOverBooking: true,
      },
    })
  }

  // visit notification controller
  async ignoreNotifications(reference: string, data: IgnoreVisitNotificationsDto): Promise<Visit> {
    return this.restClient.put({ path: `/visits/notification/visit/${reference}/ignore`, data })
  }

  async getNotificationCount(prisonId: string): Promise<NotificationCount> {
    return this.restClient.get({
      path: `/visits/notification/${prisonId}/count`,
      query: new URLSearchParams({ types: this.enabledNotifications }).toString(),
    })
  }

  async getNotificationGroups(prisonId: string): Promise<NotificationGroup[]> {
    const notificationGroups = await this.restClient.get<NotificationGroup[]>({
      path: `/visits/notification/${prisonId}/groups`,
    })

    return notificationGroups.filter(notification => this.enabledNotifications.includes(notification.type))
  }

  // orchestration-prisons-exclude-date-controller
  async unblockVisitDate(prisonId: string, date: string, username: string): Promise<void> {
    await this.restClient.put({
      path: `/config/prisons/prison/${prisonId}/exclude-date/remove`,
      data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
    })
  }

  async blockVisitDate(prisonId: string, date: string, username: string): Promise<void> {
    await this.restClient.put({
      path: `/config/prisons/prison/${prisonId}/exclude-date/add`,
      data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
    })
  }

  async getFutureBlockedDates(prisonId: string): Promise<ExcludeDateDto[]> {
    return this.restClient.get({ path: `/config/prisons/prison/${prisonId}/exclude-date/future` })
  }

  async isBlockedDate(prisonCode: string, excludeDate: string): Promise<boolean> {
    const { isExcluded } = await this.restClient.get<IsExcludeDateDto>({
      path: `/config/prisons/prison/${prisonCode}/exclude-date/${excludeDate}/isExcluded`,
    })
    return isExcluded
  }

  // orchestration-sessions-controller

  async getSingleVisitSession(
    prisonCode: string,
    sessionDate: string,
    sessionTemplateReference: string,
  ): Promise<VisitSession> {
    return this.restClient.get({
      path: '/visit-sessions/session',
      query: new URLSearchParams({
        prisonCode,
        sessionDate,
        sessionTemplateReference,
      }).toString(),
    })
  }

  async getVisitSessions(
    offenderNo: string,
    prisonId: string,
    username: string,
    minNumberOfDays?: string,
  ): Promise<VisitSession[]> {
    return this.restClient.get({
      path: '/visit-sessions',
      query: new URLSearchParams({
        prisonId,
        prisonerId: offenderNo,
        min: minNumberOfDays,
        username,
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
    } catch {
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
      path: '/config/prisons/user-type/STAFF/supported',
    })
  }

  async getPrison(id: string): Promise<Prison> {
    // rename 'code' to 'prisonId' for consistency
    const { code: prisonId, ...prisonDto } = await this.restClient.get<PrisonDto>({
      path: `/config/prisons/prison/${id}`,
    })
    return { prisonId, ...prisonDto }
  }

  private convertMainContactToVisitContact(mainContact: VisitSessionData['mainContact']): {
    visitContact: ApplicationDto['visitContact']
    mainContactId: number
  } {
    const visitContact = mainContact
      ? {
          ...(mainContact.phoneNumber && { telephone: mainContact.phoneNumber }),
          ...(mainContact.email && { email: mainContact.email }),
          name: mainContact.contactName,
        }
      : undefined
    const mainContactId = mainContact.contactId ?? null
    return { visitContact, mainContactId }
  }
}
