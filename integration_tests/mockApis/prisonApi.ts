import { stubFor } from './wiremock'

export default {
  stubPing: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/health/ping',
      },
      response: {
        status: 200,
      },
    })
  },
}
