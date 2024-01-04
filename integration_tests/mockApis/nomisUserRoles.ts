import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubUserMe: (username = 'user1', activeCaseloadId = 'HEI'): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/nomisUserRoles/me',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { username, activeCaseloadId },
      },
    })
  },

  stubNomisUserRolesPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/nomisUserRoles/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
