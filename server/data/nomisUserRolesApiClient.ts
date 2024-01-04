import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

type UserDetail = {
  username: string
  // API returns a lot more but only case load used
  activeCaseloadId: string
}

export default class NomisUserRolesApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Nomis User Roles Api Client', config.apis.nomisUserRolesApi, token)
  }

  async getUser(token: string): Promise<UserDetail> {
    logger.info('Getting user details: calling HMPPS Nomis User Roles Api')
    return NomisUserRolesApiClient.restClient(token).get({ path: '/me' })
  }
}
