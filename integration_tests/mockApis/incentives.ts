import { stubFor } from './wiremock'

export default {
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
