import { SuperAgentRequest } from 'superagent/lib/node'
import { PrisonIncentiveLevel } from '../../server/data/incentivesApiTypes'
import TestData from '../../server/routes/testutils/testData'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonIncentiveLevels: ({
    prisonId = 'HEI',
    prisonIncentiveLevels = [TestData.prisonIncentiveLevel()],
  }: {
    prisonId?: string
    prisonIncentiveLevels?: PrisonIncentiveLevel[]
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/incentive/prison-levels/${prisonId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIncentiveLevels,
      },
    })
  },

  stubPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentives/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
