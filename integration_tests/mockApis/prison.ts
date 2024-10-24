import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { OffenderRestriction, OffenderRestrictions } from '../../server/data/prisonApiTypes'

export default {
  stubOffenderRestrictions: ({
    offenderNo,
    offenderRestrictions = [],
  }: {
    offenderNo: string
    offenderRestrictions: OffenderRestriction[]
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/offenders/${offenderNo}/offender-restrictions?activeRestrictionsOnly=true`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: <OffenderRestrictions>{
          bookingId: 12345,
          offenderRestrictions,
        },
      },
    })
  },

  stubPrisonApiPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
