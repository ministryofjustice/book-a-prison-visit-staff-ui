import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import allPrisons from './responses/prisonRegister'

export default {
  stubGetPrisons: (prisons: Record<string, string>[] = allPrisons): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonRegister/prisons',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisons,
      },
    })
  },
}
