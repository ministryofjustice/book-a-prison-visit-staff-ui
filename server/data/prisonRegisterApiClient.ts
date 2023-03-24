import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { PrisonDto } from './prisonRegisterApiTypes'

export default class PrisonRegisterApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('prisonRegisterApiClient', config.apis.prisonRegister as ApiConfig, token)
  }

  async getPrisons(): Promise<PrisonDto[]> {
    return this.restClient.get({ path: '/prisons' })
  }
}
