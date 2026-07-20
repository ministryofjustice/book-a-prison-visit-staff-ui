import { format, subMonths } from 'date-fns'
import { RestClient as HmppsRestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import config, { ApiConfig } from '../config'
import logger from '../../logger'
import { getErrorStatus } from '../utils/errorHelpers'
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
  VisitRequestResponse,
  VisitRequestsCountDto,
  VisitRequestSummary,
  VisitRestriction,
  VisitSchedulerUpdatePrisonDto,
  VisitSession,
  VisitSessionsAndScheduleDto,
} from './orchestrationApiTypes'
import { Prison, VisitSessionData } from '../@types/bapv'

export default class OrchestrationApiClient {
  private readonly restClient: HmppsRestClient

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

  constructor(private readonly token: string) {
    this.restClient = new HmppsRestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, logger)
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
    return this.restClient.put(
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
      asUser(this.token),
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
    return this.restClient.put(
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
      asUser(this.token),
    )
  }

  async cancelVisit(reference: string, cancelVisitDto: CancelVisitOrchestrationDto): Promise<Visit> {
    return this.restClient.put(
      {
        path: `/visits/${reference}/cancel`,
        data: cancelVisitDto,
      },
      asUser(this.token),
    )
  }

  async getVisit(reference: string): Promise<Visit> {
    return this.restClient.get({ path: `/visits/${reference}` }, asUser(this.token))
  }

  async getVisitDetailed(reference: string): Promise<VisitBookingDetails> {
    const visitDetails = await this.restClient.get<VisitBookingDetailsRaw>(
      {
        path: `/visits/${reference}/detailed`,
      },
      asUser(this.token),
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
  ): Promise<VisitPreview[]> {
    return this.restClient.get(
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
      asUser(this.token),
    )
  }

  async getBookedVisitCountByDate(prisonId: string, date: string): Promise<number> {
    const visits = await this.restClient.get<PageVisitDto>(
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
      asUser(this.token),
    )
    return visits.totalElements ?? 0
  }

  //  orchestration-applications-controller

  async changeVisitApplication(visitSessionData: VisitSessionData): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put(
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
      asUser(this.token),
    )
  }

  async createVisitApplicationFromVisit(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    const { visitContact, mainContactId } = this.convertMainContactToVisitContact(visitSessionData.mainContact)

    return this.restClient.put(
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
      asUser(this.token),
    )
  }

  async createVisitApplication(visitSessionData: VisitSessionData, username: string): Promise<ApplicationDto> {
    return this.restClient.post(
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
      asUser(this.token),
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
    return this.restClient.put(
      {
        path: `/visitor-requests/${requestReference}/reject`,
        data: <RejectVisitorRequestDto>{ rejectionReason, actionedBy: username },
      },
      asUser(this.token),
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
    return this.restClient.put(
      {
        path: `/visitor-requests/${requestReference}/approve`,
        data: <ApproveVisitorRequestDto>{ visitorId, actionedBy: username },
      },
      asUser(this.token),
    )
  }

  async getLinkedVisitors({
    bookerReference,
    prisonerId,
  }: {
    bookerReference: string
    prisonerId: string
  }): Promise<VisitorInfoDto[]> {
    return this.restClient.get(
      {
        path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
      },
      asUser(this.token),
    )
  }

  async getBookersByEmail(email: string): Promise<BookerSearchResultsDto[]> {
    try {
      return await this.restClient.post(
        {
          path: '/public/booker/search',
          data: <SearchBookerDto>{ email },
        },
        asUser(this.token),
      )
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return []
      }
      throw error
    }
  }

  async getVisitorRequestForReview(requestReference: string): Promise<VisitorRequestForReviewDto> {
    return this.restClient.get({ path: `/visitor-requests/${requestReference}` }, asUser(this.token))
  }

  async getBookerDetails(reference: string): Promise<BookerDetailedInfoDto> {
    return this.restClient.get({ path: `/public/booker/${reference}` }, asUser(this.token))
  }

  async getNonLinkedSocialContacts({
    reference,
    prisonerId,
  }: {
    reference: string
    prisonerId: string
  }): Promise<SocialContactsDto[]> {
    return this.restClient.get(
      { path: `/public/booker/${reference}/prisoners/${prisonerId}/social-contacts` },
      asUser(this.token),
    )
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
    await this.restClient.post(
      {
        path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
        data: <RegisterVisitorForBookerPrisonerDto>{
          visitorId,
          sendNotificationFlag: sendNotification,
          actionedBy: username,
        },
      },
      asUser(this.token),
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
      await this.restClient.post(
        {
          path: `/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}/unlink`,
          data: <StaffUsernameDto>{ username },
        },
        asUser(this.token),
      )
    } catch (error) {
      // If visitor already unlinked, API returns 404 so treat this as success. Throw any other error.
      if (getErrorStatus(error) !== 404) {
        throw error
      }
    }
  }

  async getBookerVisitorRequests(bookerReference: string): Promise<BookerPrisonerVisitorRequestDto[]> {
    return this.restClient.get(
      { path: `/public/booker/${bookerReference}/permitted/visitors/requests` },
      asUser(this.token),
    )
  }

  async getVisitorRequests(prisonId: string): Promise<PrisonVisitorRequestListEntryDto[]> {
    return this.restClient.get({ path: `/prison/${prisonId}/visitor-requests` }, asUser(this.token))
  }

  async getVisitorRequestCount(prisonId: string): Promise<number> {
    return (
      await this.restClient.get<VisitorRequestsCountByPrisonCodeDto>(
        {
          path: `/prison/${prisonId}/visitor-requests/count`,
        },
        asUser(this.token),
      )
    ).count
  }

  // visit notification controller
  async ignoreNotifications(reference: string, data: IgnoreVisitNotificationsDto): Promise<Visit> {
    return this.restClient.put({ path: `/visits/notification/visit/${reference}/ignore`, data }, asUser(this.token))
  }

  async getNotificationCount(prisonId: string): Promise<number> {
    return (
      await this.restClient.get<NotificationCount>(
        {
          path: `/visits/notification/${prisonId}/count`,
          query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
        },
        asUser(this.token),
      )
    ).count
  }

  async getVisitNotifications(prisonId: string): Promise<VisitNotifications[]> {
    const visits = await this.restClient.get<VisitNotificationsRaw[]>(
      {
        path: `/visits/notification/${prisonId}/visits`,
        query: new URLSearchParams({ types: this.enabledRawNotifications }).toString(),
      },
      asUser(this.token),
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
    await this.restClient.put(
      {
        path: `/config/prisons/prison/${prisonId}/exclude-date/remove`,
        data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
      },
      asUser(this.token),
    )
  }

  async blockVisitDate(prisonId: string, date: string, username: string): Promise<void> {
    await this.restClient.put(
      {
        path: `/config/prisons/prison/${prisonId}/exclude-date/add`,
        data: <ExcludeDateDto>{ excludeDate: date, actionedBy: username },
      },
      asUser(this.token),
    )
  }

  async getFutureBlockedDatesAndSessions({
    prisonId,
    includeSessions,
  }: {
    prisonId: string
    includeSessions: boolean
  }): Promise<PrisonAndSessionsExcludeDatesDto> {
    return this.restClient.get(
      {
        path: `/v2/prisons/${prisonId}/config/exclude-dates/future`,
        query: new URLSearchParams({ includeSessions: includeSessions.toString() }).toString(),
      },
      asUser(this.token),
    )
  }

  // FIXME this endpoint is deprecated; remove this and wiremock stub and use call above with includeSessions=false instead
  async getFutureBlockedDates(prisonId: string): Promise<ExcludeDateDto[]> {
    return this.restClient.get({ path: `/config/prisons/prison/${prisonId}/exclude-date/future` }, asUser(this.token))
  }

  async isBlockedDate(prisonCode: string, excludeDate: string): Promise<boolean> {
    const { isExcluded } = await this.restClient.get<IsExcludeDateDto>(
      {
        path: `/config/prisons/prison/${prisonCode}/exclude-date/${excludeDate}/isExcluded`,
      },
      asUser(this.token),
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
    return this.restClient.post(
      {
        path: `/prison/${prisonId}/visit-passes`,
        data: <VisitPassRequestDto>{ date, actionedBy: username },
      },
      asUser(this.token),
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
    return this.restClient.post(
      {
        path: `/prison/${prisonId}/visit-passes/visit/${reference}`,
        data: <StaffUsernameDto>{ username },
      },
      asUser(this.token),
    )
  }

  // visit requests controller

  async rejectVisitRequest({
    reference,
    username,
  }: {
    reference: string
    username: string
  }): Promise<VisitRequestResponse> {
    return this.restClient.put(
      {
        path: `/visits/requests/${reference}/reject`,
        data: <RejectVisitRequestBodyDto>{ visitReference: reference, actionedBy: username },
      },
      asUser(this.token),
    )
  }

  async approveVisitRequest({
    reference,
    username,
  }: {
    reference: string
    username: string
  }): Promise<VisitRequestResponse> {
    return this.restClient.put(
      {
        path: `/visits/requests/${reference}/approve`,
        data: <ApproveVisitRequestBodyDto>{ visitReference: reference, actionedBy: username },
      },
      asUser(this.token),
    )
  }

  async getVisitRequests(prisonCode: string): Promise<VisitRequestSummary[]> {
    return this.restClient.get({ path: `/visits/requests/${prisonCode}` }, asUser(this.token))
  }

  async getVisitRequestCount(prisonCode: string): Promise<number> {
    return (
      await this.restClient.get<VisitRequestsCountDto>(
        { path: `/visits/requests/${prisonCode}/count` },
        asUser(this.token),
      )
    ).count
  }

  // orchestration-sessions-controller

  async getSingleVisitSession(
    prisonCode: string,
    sessionDate: string,
    sessionTemplateReference: string,
  ): Promise<VisitSession> {
    return this.restClient.get(
      {
        path: '/visit-sessions/session',
        query: new URLSearchParams({
          prisonCode,
          sessionDate,
          sessionTemplateReference,
        }).toString(),
      },
      asUser(this.token),
    )
  }

  async getSessionSchedule({
    prisonId,
    date,
    includeExcludedSessions,
  }: {
    prisonId: string
    date: string
    includeExcludedSessions: boolean
  }): Promise<SessionSchedule[]> {
    return this.restClient.get(
      {
        path: '/visit-sessions/schedule',
        query: new URLSearchParams({
          prisonId,
          date,
          includeExcludedSessions: includeExcludedSessions.toString(),
        }).toString(),
      },
      asUser(this.token),
    )
  }

  async getVisitSessionCapacity(
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
  ): Promise<SessionCapacity> {
    try {
      return await this.restClient.get(
        {
          path: '/visit-sessions/capacity',
          query: new URLSearchParams({ prisonId, sessionDate, sessionStartTime, sessionEndTime }).toString(),
        },
        asUser(this.token),
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
    return this.restClient.get(
      {
        path: '/visit-sessions-and-schedule',
        query: new URLSearchParams({
          prisonId,
          prisonerId,
          min: minNumberOfDays.toString(),
          username,
        }).toString(),
      },
      asUser(this.token),
    )
  }

  // visit-orders-controller
  async getVoBalance({ prisonId, prisonerId }: { prisonId: string; prisonerId: string }): Promise<PrisonerBalanceDto> {
    return this.restClient.get(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/balance`,
      },
      asUser(this.token),
    )
  }

  async changeVoBalance({
    prisonId,
    prisonerId,
    prisonerBalanceAdjustmentDto,
  }: {
    prisonId: string
    prisonerId: string
    prisonerBalanceAdjustmentDto: PrisonerBalanceAdjustmentDto
  }): Promise<void> {
    await this.restClient.put(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/balance`,
        data: prisonerBalanceAdjustmentDto,
      },
      asUser(this.token),
    )
  }

  async getVoHistory({
    prisonId,
    prisonerId,
  }: {
    prisonId: string
    prisonerId: string
  }): Promise<VisitOrderHistoryDetailsDto> {
    // fixed to get past 3 months of VO history
    const date3MonthsAgo = subMonths(new Date(), 3)
    const fromDate = format(date3MonthsAgo, 'yyyy-MM-dd')

    return this.restClient.get(
      {
        path: `/prison/${prisonId}/prisoners/${prisonerId}/visit-orders/history`,
        query: new URLSearchParams({
          fromDate,
          maxResults: '30',
        }).toString(),
      },
      asUser(this.token),
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
    await this.restClient.put(
      {
        path: `/config/sessions/session/${sessionTemplateReference}/exclude-date/add`,
        data: <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: username,
        },
      },
      asUser(this.token),
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
    await this.restClient.put(
      {
        path: `/config/sessions/session/${sessionTemplateReference}/exclude-date/remove`,
        data: <ExcludeDateDto>{
          excludeDate: date,
          actionedBy: username,
        },
      },
      asUser(this.token),
    )
  }

  // prisoner-profile-controller

  async getPrisonerProfile(prisonId: string, prisonerId: string): Promise<PrisonerProfileDto> {
    return this.restClient.get(
      {
        path: `/prisoner/${prisonId}/${prisonerId}/profile`,
      },
      asUser(this.token),
    )
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.restClient.get(
      {
        path: '/config/prisons/user-type/STAFF/supported',
      },
      asUser(this.token),
    )
  }

  async getPrison(id: string): Promise<Prison> {
    // rename 'code' to 'prisonId' for consistency
    const { code: prisonId, ...prisonDto } = await this.restClient.get<PrisonDto>(
      {
        path: `/config/prisons/prison/${id}`,
      },
      asUser(this.token),
    )
    return { prisonId, ...prisonDto }
  }

  async updatePrisonConfig({
    prisonId,
    visitSchedulerUpdatePrisonDto,
  }: {
    prisonId: string
    visitSchedulerUpdatePrisonDto: VisitSchedulerUpdatePrisonDto
  }): Promise<void> {
    await this.restClient.put(
      {
        path: `/config/prisons/prison/${prisonId}`,
        data: visitSchedulerUpdatePrisonDto,
      },
      asUser(this.token),
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
