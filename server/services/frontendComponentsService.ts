import { FrontendComponentsClient, RestClientBuilder } from '../data'
import { AvailableComponent, Component } from '../data/frontendComponentsClient'

export default class FrontendComponentsService {
  constructor(private readonly frontendComponentsClientBuilder: RestClientBuilder<FrontendComponentsClient>) {}

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    userToken: string,
  ): Promise<Record<T[number], Component>> {
    return this.frontendComponentsClientBuilder(userToken).getComponents(components, userToken)
  }
}
