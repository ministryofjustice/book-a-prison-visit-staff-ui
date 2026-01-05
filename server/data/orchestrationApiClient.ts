import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ApplicationDto,
  ApplicationMethodType,
  ApproveVisitorRequestDto,
  ApproveVisitRequestBodyDto,
  BookerDetailedInfoDto,
  BookerSearchResultsDto,
  BookingOrchestrationRequestDto,
  BookingRequestVisitorDetailsDto,
  CancelVisitOrchestrationDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  EventAuditType,
  EventAuditTypeRaw,
  ExcludeDateDto,
  IgnoreVisitNotificationsDto,
  IsExcludeDateDto,
  NotificationCount,
  NotificationType,
  NotificationTypeRaw,
  PageVisitDto,
  PrisonDto,
  PrisonerProfileDto,
  PrisonVisitorRequestDto,
  PrisonVisitorRequestListEntryDto,
  RegisterVisitorForBookerPrisonerDto,
  RejectVisitorRequestDto,
  RejectVisitRequestBodyDto,
  SearchBookerDto,
  SessionCapacity,
  SessionSchedule,
  SocialContactsDto,
  Visit,
  VisitBookingDetails,
  VisitBookingDetailsRaw,
  VisitNotifications,
  VisitNotificationsRaw,
  VisitOrderHistoryDetailsDto,
  VisitorInfoDto,
  VisitorRequestForReviewDto,
  VisitorRequestsCountByPrisonCodeDto,
  VisitPreview,
  VisitRequestResponse,
  VisitRequestsCountDto,
  VisitRequestSummary,
  VisitRestriction,
  VisitSession,
  VisitSessionsAndScheduleDto,
} from './orchestrationApiTypes'
import { Prison, VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient {
  private restClient: RestClient

  private enabledRawNotifications = config.features.notificationTypes.enabledRawNotifications

  private enabledRawEvents: EventAuditTypeRaw[] = [
    'RESERVED_VISIT',
    'CHANGING_VISIT',
    'MIGRATED_VISIT',
    'BOOKED_VISIT',
    'UPDATED_VISIT',
    'CANCELLED_VISIT',
    'REQUESTED_VISIT',
    'REQUESTED_VISIT_APPROVED',
    'REQUESTED_VISIT_REJECTED',
    'REQUESTED_VISIT_AUTO_REJECTED',
    'REQUESTED_VISIT_WITHDRAWN',
    'IGNORE_VISIT_NOTIFICATIONS_EVENT',
    ...this.enabledRawNotifications,
  ]

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // orchestration-visits-controller

  async bookVisit({
    applicationReference,
    applicationMethod,
    allowOverBooking,
    visitorDetails,
    username,
  }: {
    applicationReference: string
    applicationMethod: ApplicationMethodType
    allowOverBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
    username: string
  }): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/book`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: applicationMethod,
        allowOverBooking,
        actionedBy: username,
        userType: 'STAFF',
        visitorDetails,
      },
    })
  }

  async updateVisit({
    applicationReference,
    applicationMethod,
    allowOverBooking,
    visitorDetails,
    username,
  }: {
    applicationReference: string
    applicationMethod: ApplicationMethodType
    allowOverBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
    username: string
  }): Promise<Visit> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/update`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: applicationMethod,
        allowOverBooking,
        actionedBy: username,
        userType: 'STAFF',
        visitorDetails,
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

  async getVisitDetailed(reference: string): Promise<VisitBookingDetails> {
    const visitDetails = await this.restClient.get<VisitBookingDetailsRaw>({
      path: `/visits/${reference}/detailed`,
    })

    // Remove unsupported event and notification types and standardise types
    return {
      ...visitDetails,

      events: visitDetails.events
        .filter(event => this.enabledRawEvents.includes(event.type))
        .map(event => {
          return {
            ...event,
            type: this.getStandardisedType<EventAuditType>(event.type),
          }
        }),

      notifications: visitDetails.notifications
        .filter(notification => this.enabledRawNotifications.includes(notification.type))
        .map(notification => {
          return {
            ...notification,
            type: this.getStandardisedType<NotificationType>(notification.type),
          }
        }),
    }
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
        sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
        sessionDate: visitSessionData.selectedVisitSession.date,
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
        sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
        sessionDate: visitSessionData.selectedVisitSession.date,
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
        sessionTemplateReference: visitSessionData.selectedVisitSession.sessionTemplateReference,
        sessionDate: visitSessionData.selectedVisitSession.date,
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

  // public-booker-controller
  async rejectVisitorRequest({
    requestReference,
    rejectionReason,
  }: {
    requestReference: string
    rejectionReason: RejectVisitorRequestDto['rejectionReason']
  }): Promise<PrisonVisitorRequestDto> {
    return this.restClient.put({
      path: `/visitor-requests/${requestReference}/reject`,
      data: <RejectVisitorRequestDto>{ rejectionReason },
    })
  }

  async approveVisitorRequest({
    requestReference,
    visitorId,
  }: {
    requestReference: string
    visitorId: number
  }): Promise<PrisonVisitorRequestDto> {
    return this.restClient.put({
      path: `/visitor-requests/${requestReference}/approve`,
      data: <ApproveVisitorRequestDto>{ visitorId },
    })
  }

  async getLinkedVisitors({
    bookerReference,
    prisonerId,
  }: {
    bookerReference: string
    prisonerId: string
  }): Promise<VisitorInfoDto[]> {
    return this.restClient.get({
      path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
    })
  }

  async getBookersByEmail(email: string): Promise<BookerSearchResultsDto[]> {
    try {
      return await this.restClient.post({
        path: '/public/booker/search',
        data: <SearchBookerDto>{ email },
      })
    } catch (error) {
      if (error.status === 404) {
        return []
      }
      throw error
    }
  }

  async getVisitorRequestForReview(requestReference: string): Promise<VisitorRequestForReviewDto> {
    return this.restClient.get({ path: `/visitor-requests/${requestReference}` })
  }

  async getBookerDetails(reference: string): Promise<BookerDetailedInfoDto> {
    return this.restClient.get({ path: `/public/booker/${reference}` })
  }

  async getNonLinkedSocialContacts({
    reference,
    prisonerId,
  }: {
    reference: string
    prisonerId: string
  }): Promise<SocialContactsDto[]> {
    return this.restClient.get({ path: `/public/booker/${reference}/prisoners/${prisonerId}/social-contacts` })
  }

  async linkBookerVisitor({
    reference,
    prisonerId,
    visitorId,
    sendNotification,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
    sendNotification: boolean
  }): Promise<void> {
    await this.restClient.post({
      path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
      data: <RegisterVisitorForBookerPrisonerDto>{
        visitorId,
        active: true,
        sendNotificationFlag: sendNotification,
      },
    })
  }

  async unlinkBookerVisitor({
    reference,
    prisonerId,
    visitorId,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
  }): Promise<void> {
    try {
      await this.restClient.delete({
        path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}`,
      })
    } catch (error) {
      // If visitor already unlinked, API returns 404 so treat this as success. Throw any other error.
      if (error.status !== 404) {
        throw error
      }
    }
  }

  async getVisitorRequests(prisonId: string): Promise<PrisonVisitorRequestListEntryDto[]> {
    return this.restClient.get({ path: `/prison/${prisonId}/visitor-requests` })
  }

  async getVisitorRequestCount(prisonId: string): Promise<number> {
    return (
      await this.restClient.get<VisitorRequestsCountByPrisonCodeDto>({
        path: `/prison/${prisonId}/visitor-requests/count`,
      })
    ).count
  }

  // visit notification controller
  async ignoreNotifications(reference: string, data: IgnoreVisitNotificationsDto): Promise<Visit> {
    return this.restClient.put({ path: `/visits/notification/visit/${reference}/ignore`, data })
  }

  async getNotificationCount(prisonId: string): Promise<number> {
    return (
      await this.restClient.get<NotificationCount>({
        path: `/visits/notification/${prisonId}/count`,
        query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
      })
    ).count
  }

  async getVisitNotifications(prisonId: string): Promise<VisitNotifications[]> {
    const visits = await this.restClient.get<VisitNotificationsRaw[]>({
      path: `/visits/notification/${prisonId}/visits`,
      query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
    })

    // return visit notifications with 'type' standardised
    return visits.map(visit => {
      return {
        ...visit,
        notifications: visit.notifications.map(notification => {
          return {
            ...notification,
            type: this.getStandardisedType<NotificationType>(notification.type),
          }
        }),
      }
    })
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

  // visit requests controller

  async rejectVisitRequest({
    reference,
    username,
  }: {
    reference: string
    username: string
  }): Promise<VisitRequestResponse> {
    return this.restClient.put({
      path: `/visits/requests/${reference}/reject`,
      data: <RejectVisitRequestBodyDto>{ visitReference: reference, actionedBy: username },
    })
  }

  async approveVisitRequest({
    reference,
    username,
  }: {
    reference: string
    username: string
  }): Promise<VisitRequestResponse> {
    return this.restClient.put({
      path: `/visits/requests/${reference}/approve`,
      data: <ApproveVisitRequestBodyDto>{ visitReference: reference, actionedBy: username },
    })
  }

  async getVisitRequests(prisonCode: string): Promise<VisitRequestSummary[]> {
    return this.restClient.get({ path: `/visits/requests/${prisonCode}` })
  }

  async getVisitRequestCount(prisonCode: string): Promise<number> {
    return (await this.restClient.get<VisitRequestsCountDto>({ path: `/visits/requests/${prisonCode}/count` })).count
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

  async getVisitSessionsAndSchedule({
    prisonId,
    prisonerId,
    minNumberOfDays,
    username,
  }: {
    prisonId: string
    prisonerId: string
    minNumberOfDays: number
    username: string
  }): Promise<VisitSessionsAndScheduleDto> {
    return this.restClient.get({
      path: '/visit-sessions-and-schedule',
      query: new URLSearchParams({
        prisonId,
        prisonerId,
        min: minNumberOfDays.toString(),
        username,
      }).toString(),
    })
  }

  // visit-orders-controller

  async getVoHistory({
    prisonerId,
    fromDate,
  }: {
    prisonerId: string
    fromDate: string
  }): Promise<VisitOrderHistoryDetailsDto> {
    return this.restClient.get({
      path: `/visit-orders/${prisonerId}/history`,
      query: new URLSearchParams({
        fromDate,
      }).toString(),
    })
  }

  // prisoner-profile-controller

  async getPrisonerProfile(prisonId: string, prisonerId: string): Promise<PrisonerProfileDto> {
    return this.restClient.get({
      path: `/prisoner/${prisonId}/${prisonerId}/profile`,
    })
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
    const mainContactId = mainContact?.contactId ?? null
    return { visitContact, mainContactId }
  }

  // Process event or notification types to convert local/global visitor restrictions to single custom value
  private getStandardisedType<Type extends EventAuditType | NotificationType>(
    type: Type extends EventAuditType ? EventAuditTypeRaw : NotificationTypeRaw,
  ): Type {
    return (
      type === 'PERSON_RESTRICTION_UPSERTED_EVENT' || type === 'VISITOR_RESTRICTION_UPSERTED_EVENT'
        ? 'VISITOR_RESTRICTION'
        : type
    ) as Type
  }
}
