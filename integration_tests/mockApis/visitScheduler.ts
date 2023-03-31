import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { OutcomeDto, SessionSchedule, Visit, VisitSession } from '../../server/data/orchestrationApiTypes'
import TestData from '../../server/routes/testutils/testData'

export default {
  stubAvailableSupport: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/visitScheduler/visit-support',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportTypes(),
      },
    })
  },
  stubBookVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/visitScheduler/visits/${visit.applicationReference}/book`,
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
        url: `/visitScheduler/visits/${visit.reference}/cancel`,
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
        url: `/visitScheduler/visits/${visit.applicationReference}/slot/change`,
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
  stubSupportedPrisonIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/visitScheduler/config/prisons/supported',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: TestData.supportedPrisonIds(),
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
        urlPath: '/visitScheduler/visits/search',
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
  stubPastVisits: ({ offenderNo, pastVisits }: { offenderNo: string; pastVisits: Visit[] }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/visitScheduler/visits/search',
        queryParameters: {
          prisonerId: { equalTo: offenderNo },
          endDateTime: { matches: '.*' },
          visitStatus: { and: [{ contains: 'BOOKED' }, { contains: 'CANCELLED' }] },
          page: { equalTo: '0' },
          size: { equalTo: '1000' },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { content: pastVisits },
      },
    })
  },
  stubReserveVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/visitScheduler/visits/slot/reserve',
        bodyPatterns: [
          {
            equalToJson: {
              prisonerId: visit.prisonerId,
              prisonId: visit.prisonId,
              visitRoom: visit.visitRoom,
              visitType: visit.visitType,
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
        url: `/visitScheduler/visit-sessions/schedule?prisonId=${prisonId}&date=${date}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: sessionSchedule,
      },
    })
  },
  stubVisit: (visit: Visit): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/visitScheduler/visits/${visit.reference}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visit,
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
        url: `/visitScheduler/visit-sessions?prisonId=${prisonId}&prisonerId=${offenderNo}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: visitSessions,
      },
    })
  },
}
