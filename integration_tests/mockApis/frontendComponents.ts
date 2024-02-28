import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubFrontendComponents: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/frontendComponents/components?component=footer',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          footer: {
            html: '<footer class="govuk-footer"><div class="govuk-width-container">Footer component</div></footer>',
            css: [],
            javascript: [],
          },
        },
      },
    })
  },

  stubFrontendComponentsFail: () => {
    return stubFor({
      request: {
        method: 'GET',
        url: '/frontendComponents/components?component=footer',
      },
      response: {
        status: 500,
      },
    })
  },
}
