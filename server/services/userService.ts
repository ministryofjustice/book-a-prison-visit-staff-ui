import { convertToTitleCase } from '../utils/utils'
import type { HmppsAuthClient, PrisonApiClient, RestClientBuilder } from '../data'
import logger from '../../logger'

interface UserDetails {
  name: string
  displayName: string
}

export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClient.getUser(token)
    return { ...user, displayName: convertToTitleCase(user.name) }
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
