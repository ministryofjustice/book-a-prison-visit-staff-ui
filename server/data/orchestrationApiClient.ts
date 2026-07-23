import { format, subMonths } from 'date-fns'
import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import {
  ApplicationDto,
  ApplicationMethodType,
  ApproveVisitorRequestDto,
  ApproveVisitRequestBodyDto,
  BookerDetailedInfoDto,
  BookerPrisonerVisitorRequestDto,
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
  PrisonAndSessionsExcludeDatesDto,
  PrisonDto,
  PrisonerBalanceAdjustmentDto,
  PrisonerBalanceDto,
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
  StaffUsernameDto,
  Visit,
  VisitBookingDetails,
  VisitBookingDetailsRaw,
  VisitNotifications,
  VisitNotificationsRaw,
  VisitOrderHistoryDetailsDto,
  VisitorInfoDto,
  VisitorRequestForReviewDto,
  VisitorRequestsCountByPrisonCodeDto,
  VisitPassDto,
  VisitPassRequestDto,
  VisitPreview,
  VisitRequestRejectionReason,
  VisitRequestResponse,
  VisitRequestsCountDto,
  VisitRequestSummary,
  VisitRestriction,
  VisitSchedulerUpdatePrisonDto,
  VisitSession,
  VisitSessionsAndScheduleDto,
} from './orchestrationApiTypes'
import { Prison, VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient extends RestClient {
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
    'VISITOR_UNAPPROVED_EVENT',
    ...this.enabledRawNotifications,
  ]

  constructor(authenticationClient: AuthenticationClient) {
    super('orchestrationApiClient', config.apis.orchestration, logger, authenticationClient)
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
    return this.put(
      {
        path: `/visits/${applicationReference}/book`,
        data: <BookingOrchestrationRequestDto>{
          applicationMethodType: applicationMethod,
          allowOverBooking,
          actionedBy: username,
          userType: 'STAFF',
          visitorDetails,
        },
      },
      asSystem(username),
    )
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
    return this.put(
      {
        path: `/visits/${applicationReference}/update`,
        data: <BookingOrchestrationRequestDto>{
          applicationMethodType: applicationMethod,
          allowOverBooking,
          actionedBy: username,
          userType: 'STAFF',
          visitorDetails,
        },
      },
      asSystem(username),
    )
  }

  async cancelVisit(reference: string, cancelVisitDto: CancelVisitOrchestrationDto, username: string): Promise<Visit> {
    return this.put(
      {
        path: `/visits/${reference}/cancel`,
        data: cancelVisitDto,
      },
      asSystem(username),
    )
  }

  async getVisit(reference: string, username: string): Promise<Visit> {
    return this.get({ path: `/visits/${reference}` }, asSystem(username))
  }

  async getVisitDetailed(reference: string, username: string): Promise<VisitBookingDetails> {
    const visitDetails = await this.get<VisitBookingDetailsRaw>(
      {
        path: `/visits/${reference}/detailed`,
      },
      asSystem(username),
    )

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
    username: string,
  ): Promise<VisitPreview[]> {
    return this.get(
      {
        path: '/visits/session-template',
        query: new URLSearchParams({
          prisonCode: prisonId,
          ...(reference && { sessionTemplateReference: reference }),
          sessionDate,
          visitStatus: 'BOOKED',
          ...(visitRestrictions && { visitRestrictions }),
        }).toString(),
      },
      asSystem(username),
    )
  }

  async getBookedVisitCountByDate(prisonId: string, date: string, username: string): Promise<number> {
    const visits = await this.get<PageVisitDto>(
      {
        path: `/visits/search`,
        query: new URLSearchParams({
          prisonId,
          visitStartDate: date,
          visitEndDate: date,
          visitStatus: 'BOOKED',
          page: '0',
          size: '1',
        }).toString(),
      },
      asSystem(username),
    )
    return visits.totalElements ?? 0
  }

  //  orchestration-applications-controller

  async changeVisitApplication(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.put(
      {
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
      },
      asSystem(username),
    )
  }

  async createVisitApplicationFromVisit(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.put(
      {
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
      },
      asSystem(username),
    )
  }

  async createVisitApplication(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    return this.post(
      {
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
      },
      asSystem(username),
    )
  }

  // public-booker-controller
  async rejectVisitorRequest({
    requestReference,
    rejectionReason,
    username,
  }: {
    requestReference: string
    rejectionReason: RejectVisitorRequestDto['rejectionReason']
    username: string
  }): Promise<PrisonVisitorRequestDto> {
    return this.put(
      {
        path: `/visitor-requests/${requestReference}/reject`,
        data: <RejectVisitorRequestDto>{ rejectionReason, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async approveVisitorRequest({
    requestReference,
    visitorId,
    username,
  }: {
    requestReference: string
    visitorId: number
    username: string
  }): Promise<PrisonVisitorRequestDto> {
    return this.put(
      {
        path: `/visitor-requests/${requestReference}/approve`,
        data: <ApproveVisitorRequestDto>{ visitorId, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async getLinkedVisitors({
    bookerReference,
    prisonerId,
    username,
  }: {
    bookerReference: string
    prisonerId: string
    username: string
  }): Promise<VisitorInfoDto[]> {
    return this.get(
      {
        path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
      },
      asSystem(username),
    )
  }

  async getBookersByEmail(email: string, username: string): Promise<BookerSearchResultsDto[]> {
    try {
      return await this.post(
        {
          path: '/public/booker/search',
          data: <SearchBookerDto>{ email },
        },
        asSystem(username),
      )
    } catch (error) {
      if (error.responseStatus === 404) {
        return []
      }
      throw error
    }
  }

  async getVisitorRequestForReview(requestReference: string, username: string): Promise<VisitorRequestForReviewDto> {
    return this.get({ path: `/visitor-requests/${requestReference}` }, asSystem(username))
  }

  async getBookerDetails(reference: string, username: string): Promise<BookerDetailedInfoDto> {
    return this.get({ path: `/public/booker/${reference}` }, asSystem(username))
  }

  async getNonLinkedSocialContacts({
    reference,
    prisonerId,
    username,
  }: {
    reference: string
    prisonerId: string
    username: string
  }): Promise<SocialContactsDto[]> {
    return this.get({ path: `/public/booker/${reference}/prisoners/${prisonerId}/social-contacts` }, asSystem(username))
  }

  async linkBookerVisitor({
    reference,
    prisonerId,
    visitorId,
    sendNotification,
    username,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
    sendNotification: boolean
    username: string
  }): Promise<void> {
    await this.post(
      {
        path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
        data: <RegisterVisitorForBookerPrisonerDto>{
          visitorId,
          sendNotificationFlag: sendNotification,
          actionedBy: username,
        },
      },
      asSystem(username),
    )
  }

  async unlinkBookerVisitor({
    reference,
    prisonerId,
    visitorId,
    username,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
    username: string
  }): Promise<void> {
    try {
      await this.post(
        {
          path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}/unlink`,
          data: <StaffUsernameDto>{ username },
        },
        asSystem(username),
      )
    } catch (error) {
      // If visitor already unlinked, API returns 404 so treat this as success. Throw any other error.
      if (error.responseStatus !== 404) {
        throw error
      }
    }
  }

  async getBookerVisitorRequests(
    bookerReference: string,
    username: string,
  ): Promise<BookerPrisonerVisitorRequestDto[]> {
    return this.get({ path: `/public/booker/${bookerReference}/permitted/visitors/requests` }, asSystem(username))
  }

  async getVisitorRequests(prisonId: string, username: string): Promise<PrisonVisitorRequestListEntryDto[]> {
    return this.get({ path: `/prison/${prisonId}/visitor-requests` }, asSystem(username))
  }

  async getVisitorRequestCount(prisonId: string, username: string): Promise<number> {
    return (
      await this.get<VisitorRequestsCountByPrisonCodeDto>(
        {
          path: `/prison/${prisonId}/visitor-requests/count`,
        },
        asSystem(username),
      )
    ).count
  }

  // visit notification controller
  async ignoreNotifications(reference: string, data: IgnoreVisitNotificationsDto, username: string): Promise<Visit> {
    return this.put({ path: `/visits/notification/visit/${reference}/ignore`, data }, asSystem(username))
  }

  async getNotificationCount(prisonId: string, username: string): Promise<number> {
    return (
      await this.get<NotificationCount>(
        {
          path: `/visits/notification/${prisonId}/count`,
          query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
        },
        asSystem(username),
      )
    ).count
  }

  async getVisitNotifications(prisonId: string, username: string): Promise<VisitNotifications[]> {
    const visits = await this.get<VisitNotificationsRaw[]>(
      {
        path: `/visits/notification/${prisonId}/visits`,
        query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
      },
      asSystem(username),
    )

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
    await this.put(
      {
        path: `/config/prisons/prison/${prisonId}/exclude-date/remove`,
        data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async blockVisitDate(prisonId: string, date: string, username: string): Promise<void> {
    await this.put(
      {
        path: `/config/prisons/prison/${prisonId}/exclude-date/add`,
        data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async getFutureBlockedDatesAndSessions({
    prisonId,
    includeSessions,
    username,
  }: {
    prisonId: string
    includeSessions: boolean
    username: string
  }): Promise<PrisonAndSessionsExcludeDatesDto> {
    return this.get(
      {
        path: `/v2/prisons/${prisonId}/config/exclude-dates/future`,
        query: new URLSearchParams({ includeSessions: includeSessions.toString() }).toString(),
      },
      asSystem(username),
    )
  }

  async isBlockedDate(prisonCode: string, excludeDate: string, username: string): Promise<boolean> {
    const { isExcluded } = await this.get<IsExcludeDateDto>(
      {
        path: `/config/prisons/prison/${prisonCode}/exclude-date/${excludeDate}/isExcluded`,
      },
      asSystem(username),
    )
    return isExcluded
  }

  // visit passes controller

  async getVisitPasses({
    prisonId,
    date,
    username,
  }: {
    prisonId: string
    date: string
    username: string
  }): Promise<VisitPassDto[]> {
    return this.post(
      {
        path: `/prison/${prisonId}/visit-passes`,
        data: <VisitPassRequestDto>{ date, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async getVisitPass({
    prisonId,
    reference,
    username,
  }: {
    prisonId: string
    reference: string
    username: string
  }): Promise<VisitPassDto> {
    return this.post(
      {
        path: `/prison/${prisonId}/visit-passes/visit/${reference}`,
        data: <StaffUsernameDto>{ username },
      },
      asSystem(username),
    )
  }

  // visit requests controller

  async rejectVisitRequest({
    reference,
    visitRequestRejectionReason,
    username,
  }: {
    reference: string
    visitRequestRejectionReason: VisitRequestRejectionReason | null
    username: string
  }): Promise<VisitRequestResponse> {
    return this.put(
      {
        path: `/visits/requests/${reference}/reject`,
        data: <RejectVisitRequestBodyDto>{
          visitReference: reference,
          actionedBy: username,
          visitRequestRejectionReason,
        },
      },
      asSystem(username),
    )
  }

  async approveVisitRequest({
    reference,
    username,
  }: {
    reference: string
    username: string
  }): Promise<VisitRequestResponse> {
    return this.put(
      {
        path: `/visits/requests/${reference}/approve`,
        data: <ApproveVisitRequestBodyDto>{ visitReference: reference, actionedBy: username },
      },
      asSystem(username),
    )
  }

  async getVisitRequests(prisonCode: string, username: string): Promise<VisitRequestSummary[]> {
    return this.get({ path: `/visits/requests/${prisonCode}` }, asSystem(username))
  }

  async getVisitRequestCount(prisonCode: string, username: string): Promise<number> {
    return (await this.get<VisitRequestsCountDto>({ path: `/visits/requests/${prisonCode}/count` }, asSystem(username)))
      .count
  }

  // orchestration-sessions-controller

  async getSingleVisitSession(
    prisonCode: string,
    sessionDate: string,
    sessionTemplateReference: string,
    username: string,
  ): Promise<VisitSession> {
    return this.get(
      {
        path: '/visit-sessions/session',
        query: new URLSearchParams({
          prisonCode,
          sessionDate,
          sessionTemplateReference,
        }).toString(),
      },
      asSystem(username),
    )
  }

  async getSessionSchedule({
    prisonId,
    date,
    includeExcludedSessions,
    username,
  }: {
    prisonId: string
    date: string
    includeExcludedSessions: boolean
    username: string
  }): Promise<SessionSchedule[]> {
    return this.get(
      {
        path: '/visit-sessions/schedule',
        query: new URLSearchParams({
          prisonId,
          date,
          includeExcludedSessions: includeExcludedSessions.toString(),
        }).toString(),
      },
      asSystem(username),
    )
  }

  async getVisitSessionCapacity(
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
    username: string,
  ): Promise<SessionCapacity> {
    try {
      return await this.get(
        {
          path: '/visit-sessions/capacity',
          query: new URLSearchParams({ prisonId, sessionDate, sessionStartTime, sessionEndTime }).toString(),
        },
        asSystem(username),
      )
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
    return this.get(
      {
        path: '/visit-sessions-and-schedule',
        query: new URLSearchParams({
          prisonId,
          prisonerId,
          min: minNumberOfDays.toString(),
          username,
        }).toString(),
      },
      asSystem(username),
    )
  }

  // visit-orders-controller
  async getVoBalance({
    prisonId,
    prisonerId,
    username,
  }: {
    prisonId: string
    prisonerId: string
    username: string
  }): Promise<PrisonerBalanceDto> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/balance`,
      },
      asSystem(username),
    )
  }

  async changeVoBalance({
    prisonId,
    prisonerId,
    prisonerBalanceAdjustmentDto,
    username,
  }: {
    prisonId: string
    prisonerId: string
    prisonerBalanceAdjustmentDto: PrisonerBalanceAdjustmentDto
    username: string
  }): Promise<void> {
    await this.put(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/balance`,
        data: prisonerBalanceAdjustmentDto,
      },
      asSystem(username),
    )
  }

  async getVoHistory({
    prisonId,
    prisonerId,
    username,
  }: {
    prisonId: string
    prisonerId: string
    username: string
  }): Promise<VisitOrderHistoryDetailsDto> {
    // fixed to get past 3 months of VO history
    const date3MonthsAgo = subMonths(new Date(), 3)
    const fromDate = format(date3MonthsAgo, 'yyyy-MM-dd')

    return this.get(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/history`,
        query: new URLSearchParams({
          fromDate,
          maxResults: '30',
        }).toString(),
      },
      asSystem(username),
    )
  }

  // orchestration-sessions-exclude-date-controller

  async blockVisitSession({
    sessionTemplateReference,
    date,
    username,
  }: {
    sessionTemplateReference: string
    date: string
    username: string
  }): Promise<void> {
    await this.put(
      {
        path: `/config/sessions/session/${sessionTemplateReference}/exclude-date/add`,
        data: <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: username,
        },
      },
      asSystem(username),
    )
  }

  async unblockVisitSession({
    sessionTemplateReference,
    date,
    username,
  }: {
    sessionTemplateReference: string
    date: string
    username: string
  }): Promise<void> {
    await this.put(
      {
        path: `/config/sessions/session/${sessionTemplateReference}/exclude-date/remove`,
        data: <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: username,
        },
      },
      asSystem(username),
    )
  }

  // prisoner-profile-controller

  async getPrisonerProfile(prisonId: string, prisonerId: string, username: string): Promise<PrisonerProfileDto> {
    return this.get(
      {
        path: `/prisoner/${prisonId}/${prisonerId}/profile`,
      },
      asSystem(username),
    )
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisonIds(username: string): Promise<string[]> {
    return this.get(
      {
        path: '/config/prisons/user-type/STAFF/supported',
      },
      asSystem(username),
    )
  }

  async getPrison(id: string, username: string): Promise<Prison> {
    // rename 'code' to 'prisonId' for consistency
    const { code: prisonId, ...prisonDto } = await this.get<PrisonDto>(
      {
        path: `/config/prisons/prison/${id}`,
      },
      asSystem(username),
    )
    return { prisonId, ...prisonDto }
  }

  async updatePrisonConfig({
    prisonId,
    visitSchedulerUpdatePrisonDto,
    username,
  }: {
    prisonId: string
    visitSchedulerUpdatePrisonDto: VisitSchedulerUpdatePrisonDto
    username: string
  }): Promise<void> {
    await this.put(
      {
        path: `/config/prisons/prison/${prisonId}`,
        data: visitSchedulerUpdatePrisonDto,
      },
      asSystem(username),
    )
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
          languagePreference: mainContact.languagePreference ?? 'en',
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
