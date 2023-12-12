import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import type { HmppsAuthClient, PrisonApiClient, RestClientBuilder } from '../data'
import logger from '../../logger'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    return { ...user, roles: this.getUserRoles(token), displayName: convertToTitleCase(user.name) }
  }

  getUserRoles(token: string): string[] {
    const { authorities: roles = [] } = jwtDecode(token) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }

  async getUserCaseLoadIds(username: string): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientFactory(token)

    const caseLoads = await prisonApiClient.getUserCaseLoads()

    return caseLoads.reduce((caseLoadsIds, caseLoad) => {
      return caseLoadsIds.concat(caseLoad.caseLoadId)
    }, [])
  }

  async setActiveCaseLoad(caseLoadId: string, username: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientFactory(token)

    logger.info(`Setting case load to ${caseLoadId} for ${username}`)
    try {
      await prisonApiClient.setActiveCaseLoad(caseLoadId)
    } catch (error) {
      logger.error(`Couldn't set user case load to ${caseLoadId}`, error)
    }
  }
}
