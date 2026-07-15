import { AuthenticationClient, type TokenStore } from '@ministryofjustice/hmpps-auth-clients'

import logger from '../../logger'
import config from '../config'

export default class HmppsAuthClient {
  private readonly authClient: AuthenticationClient

  constructor(tokenStore: TokenStore | null = null) {
    this.authClient = new AuthenticationClient(config.apis.hmppsAuth, logger, tokenStore ?? undefined)
  }

  async getSystemClientToken(username?: string): Promise<string> {
    return this.authClient.getToken(username)
  }

  async getToken(username?: string): Promise<string> {
    return this.authClient.getToken(username)
  }
}
