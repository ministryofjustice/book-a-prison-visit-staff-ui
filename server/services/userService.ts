import type { HmppsAuthClient, NomisUserRolesApiClient, PrisonApiClient, RestClientBuilder } from '../data'
import logger from '../../logger'

// TODO review and probably remove class
export default class UserService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly nomisUserRolesApiClient: NomisUserRolesApiClient,
    private readonly prisonApiClientFactory: RestClientBuilder<PrisonApiClient>,
  ) {}

  async getActiveCaseLoadId(token: string): Promise<string> {
    const user = await this.nomisUserRolesApiClient.getUser(token)
    return user.activeCaseloadId
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
