import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import {
  OutcomeDto,
  PrisonerProfile,
  SessionCapacity,
  SessionSchedule,
  Visit,
  VisitHistoryDetails,
  VisitSession,
} from '../../server/data/orchestrationApiTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubBookVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/book`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
      },
    })
  },
  stubCancelVisit: ({ visit, outcome }: { visit: Visit; outcome: OutcomeDto }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.reference}/cancel`,
        bodyPatterns: [
          {
            equalToJson: {
              outcomeStatus: outcome.outcomeStatus,
              text: outcome.text,
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
  stubChangeReservedSlot: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/visits/${visit.applicationReference}/slot/change`,
        bodyPatterns: [
          {
            equalToJson: {
              visitRestriction: visit.visitRestriction,
              startTimestamp: visit.startTimestamp,
              endTimestamp: visit.endTimestamp,
              visitContact: visit.visitContact,
              visitors: visit.visitors,
              visitorSupport: visit.visitorSupport,
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
  stubReserveVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/orchestration/visits/slot/reserve',
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: visit.prisonerId,
              sessionTemplateReference: visit.sessionTemplateReference,
              visitRestriction: visit.visitRestriction,
              startTimestamp: visit.startTimestamp,
              endTimestamp: visit.endTimestamp,
              visitors: visit.visitors,
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
  stubUpcomingVisits: ({
    offenderNo,
    upcomingVisits,
  }: {
    offenderNo: string
    upcomingVisits: Visit[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/orchestration/visits/search',
        queryParameters: {
          prisonerId: { equalTo: offenderNo },
          startDateTime: { matches: '.*' },
          visitStatus: { and: [{ contains: 'BOOKED' }, { contains: 'CANCELLED' }] },
          page: { equalTo: '0' },
          size: { equalTo: '1000' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: upcomingVisits },
      },
    })
  },
  stubVisitsByDate: ({
    startDateTime,
    endDateTime,
    prisonId,
    visits,
  }: {
    startDateTime: string
    endDateTime: string
    prisonId: string
    visits: Visit
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/orchestration/visits/search`,
        queryParameters: {
          prisonId: { equalTo: prisonId },
          startDateTime: { equalTo: startDateTime },
          endDateTime: { equalTo: endDateTime },
          visitStatus: { equalTo: 'BOOKED' },
          page: { equalTo: '0' },
          size: { equalTo: '1000' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: visits },
      },
    })
  },
  stubAvailableSupport: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/orchestration/visit-support',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportTypes(),
      },
    })
  },
  stubVisitSessions: ({
    prisonId,
    offenderNo,
    visitSessions,
  }: {
    prisonId: string
    offenderNo: string
    visitSessions: VisitSession[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/visit-sessions?prisonId=${prisonId}&prisonerId=${offenderNo}`,
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
        url: '/orchestration/config/prisons/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportedPrisonIds(),
      },
    })
  },
}
