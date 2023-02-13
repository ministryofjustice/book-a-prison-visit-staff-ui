import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import TestData from '../../server/routes/testutils/testData'
import { Prison } from '../../server/@types/bapv'

export default {
  stubPrisons: (prisons: Prison[] = TestData.prisons()): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/prisonRegister/prisons',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisons,
      },
    })
  },
}
