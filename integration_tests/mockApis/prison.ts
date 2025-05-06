import { stubFor } from './wiremock'

export default {
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
