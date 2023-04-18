import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { PrisonerProfile, VisitHistoryDetails } from '../../server/data/orchestrationApiTypes'

export default {
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
}
