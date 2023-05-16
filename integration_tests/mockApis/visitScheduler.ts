import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { SessionCapacity, SessionSchedule, VisitSession } from '../../server/data/orchestrationApiTypes'

export default {
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
        urlPath: `/visitScheduler/visit-sessions/capacity`,
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
}
