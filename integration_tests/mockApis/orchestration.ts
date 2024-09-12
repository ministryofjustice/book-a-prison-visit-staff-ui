import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  ApplicationDto,
  ApplicationMethodType,
  CancelVisitOrchestrationDto,
  IgnoreVisitNotificationsDto,
  NotificationCount,
  NotificationGroup,
  NotificationType,
  PrisonDto,
  PrisonerProfile,
  PrisonExcludeDateDto,
  SessionCapacity,
  SessionSchedule,
  Visit,
  VisitHistoryDetails,
  VisitPreview,
  VisitRestriction,
  VisitSession,
} from '../../server/data/orchestrationApiTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubBookVisit: ({
    visit,
    applicationMethod,
    username,
  }: {
    visit: Visit
    applicationMethod: ApplicationMethodType
    username: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/book`,
        bodyPatterns: [
          {
            equalToJson: {
              applicationMethodType: applicationMethod,
              allowOverBooking: true,
              actionedBy: username,
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
  stubVisitHistory: (visitHistoryDetails: VisitHistoryDetails): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/${visitHistoryDetails.visit.reference}/history`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitHistoryDetails,
      },
    })
  },
  stubGetVisitsBySessionTemplate: ({
    prisonId,
    reference,
    sessionDate,
    visitRestrictions,
    visits,
  }: {
    prisonId: string
    reference: string
    sessionDate: string
    visitRestrictions: VisitRestriction
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
          visitRestrictions: { equalTo: visitRestrictions },
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
    notificationCount = TestData.notificationCount(),
  }: {
    prisonId: string
    notificationCount: NotificationCount
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/notification/${prisonId}/count`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: notificationCount,
      },
    })
  },
  stubGetNotificationGroups: ({
    prisonId = 'HEI',
    notificationGroups = [TestData.notificationGroup()],
  }: {
    prisonId: string
    notificationGroups: NotificationGroup[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/notification/${prisonId}/groups`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: notificationGroups,
      },
    })
  },
  stubGetVisitNotifications: ({
    reference,
    notifications = [],
  }: {
    reference: string
    notifications: NotificationType[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visits/notification/visit/${reference}/types`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: notifications,
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
    prisonId: string
    blockedDates: PrisonExcludeDateDto[]
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

  stubVisitSessions: ({
    prisonId,
    offenderNo,
    visitSessions,
    username = 'USER1',
    min = '3',
  }: {
    prisonId: string
    offenderNo: string
    visitSessions: VisitSession[]
    username: string
    min: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visit-sessions?prisonId=${prisonId}&prisonerId=${offenderNo}&min=${min}&username=${username}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessions,
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
  stubPrisonerProfile: ({
    prisonId,
    prisonerId,
    profile,
  }: {
    prisonId: string
    prisonerId: string
    profile: PrisonerProfile
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/prisoner/${prisonId}/${prisonerId}/profile`,
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
