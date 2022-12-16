import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import PrisonApiClient from '../data/prisonApiClient'
import { createCaseLoads } from '../data/__testutils/testObjects'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/prisonApiClient')

const token = 'some token'

afterEach(() => {
  jest.resetAllMocks()
})

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService

  describe('getUser', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      userService = new UserService(hmppsAuthClient, undefined, undefined)
    })

    it('Retrieves and formats user name', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })
    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getUserCaseLoadIds', () => {
    const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
    const systemToken = async (user: string): Promise<string> => `${user}-token-1`
    let prisonApiClientBuilder

    const usersCaseLoads = createCaseLoads()

    beforeEach(() => {
      prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
      userService = new UserService(undefined, prisonApiClientBuilder, systemToken)
    })

    it('should return an array of available caseload IDs for current user', async () => {
      prisonApiClient.getUserCaseLoads.mockResolvedValue(usersCaseLoads)

      const result = await userService.getUserCaseLoadIds('user')

      expect(result).toStrictEqual(['BLI', 'HEI'])
    })
  })

  describe('setActiveCaseLoad', () => {
    const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
    const systemToken = async (user: string): Promise<string> => `${user}-token-1`
    let prisonApiClientBuilder

    beforeEach(() => {
      prisonApiClientBuilder = jest.fn().mockReturnValue(prisonApiClient)
      userService = new UserService(undefined, prisonApiClientBuilder, systemToken)
    })

    it('should set active case load for current user', async () => {
      prisonApiClient.setActiveCaseLoad.mockResolvedValue()

      await userService.setActiveCaseLoad('HEI', 'user')

      expect(prisonApiClient.setActiveCaseLoad).toHaveBeenCalledWith('HEI')
    })

    it('should catch and handle error when setting caseload', async () => {
      prisonApiClient.setActiveCaseLoad.mockRejectedValue(new Error('some error'))

      await userService.setActiveCaseLoad('HEI', 'user')

      expect(prisonApiClient.setActiveCaseLoad).toHaveBeenCalledWith('HEI')
    })
  })
})
