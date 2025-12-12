import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  ApplicationDto,
  ApplicationMethodType,
  ApplicationValidationErrorResponse,
  BookerDetailedInfoDto,
  BookerSearchResultsDto,
  BookingRequestVisitorDetailsDto,
  CancelVisitOrchestrationDto,
  ExcludeDateDto,
  IgnoreVisitNotificationsDto,
  PrisonDto,
  PrisonerProfileDto,
  PrisonVisitorRequestDto,
  PrisonVisitorRequestListEntryDto,
  SessionCapacity,
  SessionSchedule,
  SocialContactsDto,
  Visit,
  VisitBookingDetailsRaw,
  VisitNotificationsRaw,
  VisitorRequestForReviewDto,
  VisitPreview,
  VisitRequestResponse,
  VisitRequestSummary,
  VisitSessionsAndScheduleDto,
} from '../../server/data/orchestrationApiTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubBookVisit: ({
    visit,
    applicationMethod,
    username,
    allowOverBooking = false,
    visitorDetails,
  }: {
    visit: Visit
    applicationMethod: ApplicationMethodType
    username: string
    allowOverBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/book`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationMethodType: applicationMethod,
              allowOverBooking,
              actionedBy: username,
              userType: 'STAFF',
              visitorDetails,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubBookVisitValidationFailed: ({
    applicationReference,
    validationErrors = ['APPLICATION_INVALID_NON_ASSOCIATION_VISITS'],
  }: {
    applicationReference: string
    validationErrors: ApplicationValidationErrorResponse['validationErrors'][number][]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${applicationReference}/book`,
      },
      response: {
        status: 422,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 422,
          errorCode: null,
          userMessage: 'Prisoner validation failed',
          developerMessage: null,
          validationErrors,
        },
      },
    })
  },
  stubUpdateVisit: ({
    visit,
    applicationMethod,
    username,
    allowOverBooking = false,
    visitorDetails,
  }: {
    visit: Visit
    applicationMethod: ApplicationMethodType
    username: string
    allowOverBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/update`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationMethodType: applicationMethod,
              allowOverBooking,
              actionedBy: username,
              userType: 'STAFF',
              visitorDetails,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubCancelVisit: ({
    visit,
    cancelVisitDto,
  }: {
    visit: Visit
    cancelVisitDto: CancelVisitOrchestrationDto
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.reference}/cancel`,
        bodyPatterns: [
          {
            equalToJson: {
              cancelOutcome: {
                outcomeStatus: cancelVisitDto.cancelOutcome.outcomeStatus,
                text: cancelVisitDto.cancelOutcome.text,
              },
              applicationMethodType: cancelVisitDto.applicationMethodType,
              actionedBy: cancelVisitDto.actionedBy,
              userType: cancelVisitDto.userType,
            },
            ignoreArrayOrder: true,
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubCreateVisitApplicationFromVisit: ({
    visitReference,
    application,
  }: {
    visitReference: string
    application: ApplicationDto
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/application/${visitReference}/change`,
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: application.prisonerId,
              sessionTemplateReference: application.sessionTemplateReference,
              sessionDate: application.startTimestamp.split('T')[0],
              applicationRestriction: application.visitRestriction,
              visitContact: application.visitContact,
              visitors: application.visitors,
              visitorSupport: application.visitorSupport,
              userType: 'STAFF',
              actionedBy: 'USER1',
              allowOverBooking: true,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },
  stubChangeVisitApplication: (application: ApplicationDto): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/application/${application.reference}/slot/change`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationRestriction: application.visitRestriction,
              sessionTemplateReference: application.sessionTemplateReference,
              sessionDate: application.startTimestamp.split('T')[0],
              visitContact: application.visitContact,
              visitors: application.visitors,
              visitorSupport: application.visitorSupport,
              allowOverBooking: true,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },
  stubCreateVisitApplication: (application: ApplicationDto): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/orchestration/visits/application/slot/reserve',
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: application.prisonerId,
              sessionTemplateReference: application.sessionTemplateReference,
              sessionDate: application.startTimestamp.split('T')[0],
              applicationRestriction: application.visitRestriction,
              visitors: application.visitors,
              userType: 'STAFF',
              actionedBy: 'USER1',
              allowOverBooking: true,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: application,
      },
    })
  },
  stubVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/${visit.reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubGetVisitDetailed: (visitDetails: VisitBookingDetailsRaw): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/${visitDetails.reference}/detailed`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitDetails,
      },
    })
  },
  stubGetVisitsBySessionTemplate: ({
    prisonId,
    reference,
    sessionDate,
    visits,
  }: {
    prisonId: string
    reference: string
    sessionDate: string
    visits: VisitPreview[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visits/session-template',
        queryParameters: {
          prisonCode: { equalTo: prisonId },
          sessionTemplateReference: { equalTo: reference },
          sessionDate: { equalTo: sessionDate },
          visitStatus: { equalTo: 'BOOKED' },
          visitRestrictions: { equalTo: 'OPEN,CLOSED' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visits,
      },
    })
  },
  stubGetVisitsWithoutSessionTemplate: ({
    prisonId,
    sessionDate,
    visits,
  }: {
    prisonId: string
    sessionDate: string
    visits: VisitPreview[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visits/session-template',
        queryParameters: {
          prisonCode: { equalTo: prisonId },
          sessionTemplateReference: { absent: true },
          sessionDate: { equalTo: sessionDate },
          visitStatus: { equalTo: 'BOOKED' },
          visitRestrictions: { absent: true },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visits,
      },
    })
  },

  stubGetBookedVisitCountByDate: ({
    prisonId = 'HEI',
    date,
    count = 0,
  }: {
    prisonId: string
    date: string
    count: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visits/search',
        queryParameters: {
          prisonId: { equalTo: prisonId },
          visitStartDate: { equalTo: date },
          visitEndDate: { equalTo: date },
          visitStatus: { equalTo: 'BOOKED' },
          page: { equalTo: '0' },
          size: { equalTo: '1' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { totalElements: count },
      },
    })
  },

  stubApproveVisitorRequest: ({
    visitorId = 4321,
    requestReference = TestData.visitorRequest().reference,
    visitorRequest = TestData.visitorRequest(),
  }: {
    visitorId?: number
    requestReference?: string
    visitorRequest?: PrisonVisitorRequestDto
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visitor-requests/${requestReference}/approve`,
        bodyPatterns: [
          {
            equalToJson: { visitorId },
          },
        ],
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitorRequest,
      },
    })
  },

  stubGetBookersByEmail: ({
    email,
    bookers = [TestData.bookerSearchResult()],
  }: {
    email: string
    bookers: BookerSearchResultsDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/orchestration/public/booker/search',
        bodyPatterns: [
          {
            equalToJson: { email },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: bookers,
      },
    })
  },

  stubGetVisitorRequestForReview: (
    visitorRequest: VisitorRequestForReviewDto = TestData.visitorRequestForReview(),
  ): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visitor-requests/${visitorRequest.reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitorRequest,
      },
    })
  },

  stubGetBookerDetails: ({
    reference,
    booker = TestData.bookerDetailedInfo(),
  }: {
    reference: string
    booker: BookerDetailedInfoDto
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: booker,
      },
    })
  },

  stubGetNonLinkedSocialContacts: ({
    reference,
    prisonerId,
    socialContacts,
  }: {
    reference: string
    prisonerId: string
    socialContacts: [SocialContactsDto]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/public/booker/${reference}/prisoners/${prisonerId}/social-contacts`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: socialContacts,
      },
    })
  },

  stubLinkBookerVisitor: ({
    reference,
    prisonerId,
    visitorId,
    sendNotification,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
    sendNotification: boolean
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: `/orchestration/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors`,
        bodyPatterns: [
          {
            equalToJson: {
              visitorId,
              active: true,
              sendNotificationFlag: sendNotification,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },

  stubUnlinkBookerVisitor: ({
    reference,
    prisonerId,
    visitorId,
  }: {
    reference: string
    prisonerId: string
    visitorId: number
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        url: `/orchestration/public/booker/${reference}/permitted/prisoners/${prisonerId}/permitted/visitors/${visitorId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },

  stubGetVisitorRequests: ({
    prisonId = 'HEI',
    visitorRequestListEntries = [TestData.visitorRequestListEntry()],
  }: {
    prisonId?: string
    visitorRequestListEntries?: PrisonVisitorRequestListEntryDto[]
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/prison/${prisonId}/visitor-requests`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitorRequestListEntries,
      },
    })
  },

  stubGetVisitorRequestCount: ({
    prisonId = 'HEI',
    visitorRequestCount = 4,
  }: {
    prisonId?: string
    visitorRequestCount?: number
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/prison/${prisonId}/visitor-requests/count`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { count: visitorRequestCount },
      },
    })
  },

  stubIgnoreNotifications: ({
    ignoreVisitNotificationsDto,
    visit,
  }: {
    ignoreVisitNotificationsDto: IgnoreVisitNotificationsDto
    visit: Visit
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/notification/visit/${visit.reference}/ignore`,
        bodyPatterns: [
          {
            equalToJson: {
              reason: ignoreVisitNotificationsDto.reason,
              actionedBy: ignoreVisitNotificationsDto.actionedBy,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubGetNotificationCount: ({
    prisonId = 'HEI',
    notificationCount = 5,
  }: {
    prisonId?: string
    notificationCount?: number
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/orchestration/visits/notification/${prisonId}/count\\?types=.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { count: notificationCount },
      },
    })
  },

  stubGetVisitNotifications: ({
    prisonId = 'HEI',
    visitNotifications = [TestData.visitNotificationsRaw()],
  }: {
    prisonId: string
    visitNotifications: VisitNotificationsRaw[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/orchestration/visits/notification/${prisonId}/visits\\?types=.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitNotifications,
      },
    })
  },

  stubUnblockVisitDate: ({
    prisonId = 'HEI',
    date,
    username = 'USER1',
  }: {
    prisonId: string
    date: string
    username: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/config/prisons/prison/${prisonId}/exclude-date/remove`,
        bodyPatterns: [
          {
            equalToJson: {
              excludeDate: date,
              actionedBy: username,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },

  stubBlockVisitDate: ({
    prisonId = 'HEI',
    date,
    username = 'USER1',
  }: {
    prisonId: string
    date: string
    username: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/config/prisons/prison/${prisonId}/exclude-date/add`,
        bodyPatterns: [
          {
            equalToJson: {
              excludeDate: date,
              actionedBy: username,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },

  stubGetFutureBlockedDates: ({
    prisonId = 'HEI',
    blockedDates = [],
  }: {
    prisonId?: string
    blockedDates: ExcludeDateDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/config/prisons/prison/${prisonId}/exclude-date/future`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: blockedDates,
      },
    })
  },

  stubIsBlockedDate: ({
    prisonId,
    excludeDate,
    excludeDates = [TestData.excludeDateDto()],
  }: {
    prisonId: string
    excludeDate: string
    excludeDates: ExcludeDateDto[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/config/prisons/prison/${prisonId}/exclude-date/${excludeDate}/isExcluded`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: excludeDates,
      },
    })
  },

  stubRejectVisitRequest: ({
    reference,
    username,
    visitRequestResponse,
  }: {
    reference: string
    username: string
    visitRequestResponse: VisitRequestResponse
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/requests/${reference}/reject`,
        bodyPatterns: [
          {
            equalToJson: {
              visitReference: reference,
              actionedBy: username,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitRequestResponse,
      },
    })
  },

  stubApproveVisitRequest: ({
    reference,
    username,
    visitRequestResponse,
  }: {
    reference: string
    username: string
    visitRequestResponse: VisitRequestResponse
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/requests/${reference}/approve`,
        bodyPatterns: [
          {
            equalToJson: {
              visitReference: reference,
              actionedBy: username,
            },
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitRequestResponse,
      },
    })
  },

  stubGetVisitRequests: ({
    prisonId = 'HEI',
    visitRequests = [TestData.visitRequestSummary()],
  }: {
    prisonId: string
    visitRequests: VisitRequestSummary[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/requests/${prisonId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitRequests,
      },
    })
  },

  stubGetVisitRequestCount: ({
    prisonId = 'HEI',
    visitRequestCount = 3,
  }: {
    prisonId?: string
    visitRequestCount?: number
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/requests/${prisonId}/count`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { count: visitRequestCount },
      },
    })
  },

  stubSessionSchedule: ({
    prisonId,
    date,
    sessionSchedule,
  }: {
    prisonId: string
    date: string
    sessionSchedule: SessionSchedule[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visit-sessions/schedule?prisonId=${prisonId}&date=${date}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: sessionSchedule,
      },
    })
  },
  stubVisitSessionCapacity: ({
    prisonId,
    sessionDate,
    sessionStartTime,
    sessionEndTime,
    sessionCapacity,
  }: {
    prisonId: string
    sessionDate: string
    sessionStartTime: string
    sessionEndTime: string
    sessionCapacity: SessionCapacity
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/orchestration/visit-sessions/capacity`,
        queryParameters: {
          prisonId: { equalTo: prisonId },
          sessionDate: { equalTo: sessionDate },
          sessionStartTime: { equalTo: sessionStartTime },
          sessionEndTime: { equalTo: sessionEndTime },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: sessionCapacity,
      },
    })
  },

  stubGetVisitSessionsAndSchedule: ({
    prisonId = 'HEI',
    prisonerId,
    minNumberOfDays = 3,
    username = 'USER1',
    visitSessionsAndSchedule = TestData.visitSessionsAndSchedule(),
  }: {
    prisonId: string
    prisonerId: string
    minNumberOfDays: number
    username: string
    visitSessionsAndSchedule: VisitSessionsAndScheduleDto
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/orchestration/visit-sessions-and-schedule`,
        queryParameters: {
          prisonId: { equalTo: prisonId },
          prisonerId: { equalTo: prisonerId },
          min: { equalTo: minNumberOfDays.toString() },
          username: { equalTo: username },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessionsAndSchedule,
      },
    })
  },

  stubPrisonerProfile: (profile: PrisonerProfileDto): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/prisoner/${profile.prisonId}/${profile.prisonerId}/profile`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: profile,
      },
    })
  },
  stubSupportedPrisonIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/config/prisons/user-type/STAFF/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportedPrisonIds(),
      },
    })
  },
  stubSupportedPrisonIdsError: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/config/prisons/user-type/STAFF/supported',
      },
      response: {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetPrison: (prison: PrisonDto = TestData.prisonDto()): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/config/prisons/prison/${prison.code}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prison,
      },
    })
  },
  stubOrchestrationPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/orchestration/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
