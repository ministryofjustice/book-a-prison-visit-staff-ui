import { SuperAgentRequest } from 'superagent/lib/node'
import { PrisonIncentiveLevel } from '../../server/data/incentivesApiTypes'
import TestData from '../../server/routes/testutils/testData'
import { stubFor } from './wiremock'
import { VisitSchedulerUpdatePrisonDto } from '../../server/data/orchestrationApiTypes'
import { PrisonRemandConfig } from '../../server/@types/bapv'

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
        url: `/incentives/incentive/prison-levels/${prisonId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIncentiveLevels,
      },
    })
  },

  stubGetRemandConfig: ({
    prisonId = 'HEI',
    remandConfig = TestData.prisonRemandConfig(),
  }: {
    prisonId?: string
    remandConfig?: PrisonRemandConfig
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/orchestration/config/prisons/prison/${prisonId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: remandConfig,
      },
    })
  },

  stubUpdateRemandConfig: ({
    prisonId = 'HEI',
    visitSchedulerUpdatePrisonDto = TestData.prisonRemandConfig(),
  }: {
    prisonId?: string
    visitSchedulerUpdatePrisonDto?: VisitSchedulerUpdatePrisonDto
  } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        url: `/orchestration/config/prisons/prison/${prisonId}`,
        bodyPatterns: [
          {
            equalToJson: {
              weekStartDay: visitSchedulerUpdatePrisonDto.weekStartDay,
              remandVisitLimitPerWeek: visitSchedulerUpdatePrisonDto.remandVisitLimitPerWeek,
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
