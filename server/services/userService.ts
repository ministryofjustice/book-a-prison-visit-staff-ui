import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../data/prisonApiClient'
import logger from '../../logger'

interface UserDetails {
  name: string
  displayName: string
}

type PrisonApiClientBuilder = (token: string) => PrisonApiClient
export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly prisonApiClientBuilder: PrisonApiClientBuilder,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClient.getUser(token)
    return { ...user, displayName: convertToTitleCase(user.name) }
  }

  async getUserCaseLoadIds(username: string): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)

    const caseLoads = await prisonApiClient.getUserCaseLoads()

    return caseLoads.reduce((caseLoadsIds, caseLoad) => {
      return caseLoadsIds.concat(caseLoad.caseLoadId)
    }, [])
  }

  async setActiveCaseLoad(caseLoadId: string, username: string): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonApiClient = this.prisonApiClientBuilder(token)

    logger.info(`Setting case load to ${caseLoadId} for ${username}`)
    try {
      await prisonApiClient.setActiveCaseLoad(caseLoadId)
    } catch (error) {
      logger.error(`Couldn't set user case load to ${caseLoadId}`, error)
    }
  }
}
