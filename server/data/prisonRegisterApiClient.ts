import RestClient from './restClient'
import config from '../config'
import { PrisonDto } from './prisonRegisterApiTypes'

export const prisonRegisterApiClientBuilder = (token: string): PrisonRegisterApiClient => {
  const restClient = new RestClient('prisonRegisterApi', config.apis.prisonRegister, token)
  const prisonRegisterClient = new PrisonRegisterApiClient(restClient)

  return prisonRegisterClient
}

class PrisonRegisterApiClient {
  constructor(private readonly restclient: RestClient) {}

  getPrisons(): Promise<PrisonDto[]> {
    return this.restclient.get({ path: '/prisons' })
  }
}

export default PrisonRegisterApiClient
