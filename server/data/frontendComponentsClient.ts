import RestClient from './restClient'
import config from '../config'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export default class FrontendComponentsClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Frontend components', config.apis.frontendComponents, token)
  }

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    userToken: string,
  ): Promise<Record<T[number], Component>> {
    return this.restClient.get({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': userToken },
    })
  }
}
