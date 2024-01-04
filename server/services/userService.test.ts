import UserService from './userService'
import TestData from '../routes/testutils/testData'
import {
  createMockHmppsAuthClient,
  createMockManageUsersApiClient,
  createMockNomisUserRolesApiClient,
  createMockPrisonApiClient,
} from '../data/testutils/mocks'
import type { User } from '../data/manageUsersApiClient'
import createUserToken from '../testutils/createUserToken'

jest.mock('../data/manageUsersApiClient')

describe('User service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const manageUsersApiClient = createMockManageUsersApiClient()
  const nomisUserRolesApiClient = createMockNomisUserRolesApiClient()
  const prisonApiClient = createMockPrisonApiClient()
  let userService: UserService

  const PrisonApiClientFactory = jest.fn()

  describe('getUser', () => {
    beforeEach(() => {
      PrisonApiClientFactory.mockReturnValue(prisonApiClient)
      userService = new UserService(
        hmppsAuthClient,
        manageUsersApiClient,
        nomisUserRolesApiClient,
        PrisonApiClientFactory,
      )
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('some token')
    })

    it('Retrieves and formats user name', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves and formats roles', async () => {
      const token = createUserToken(['ROLE_ONE', 'ROLE_TWO'])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.roles).toEqual(['ONE', 'TWO'])
    })

    it('Propagates error', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getActiveCaseLoadId', () => {
    beforeEach(() => {
      PrisonApiClientFactory.mockReturnValue(prisonApiClient)
      userService = new UserService(
        hmppsAuthClient,
        manageUsersApiClient,
        nomisUserRolesApiClient,
        PrisonApiClientFactory,
      )
      hmppsAuthClient.getSystemClientToken.mockResolvedValue('some token')
    })

    it('should return the active case load ID for the current user', async () => {
      const token = createUserToken([])
      nomisUserRolesApiClient.getUser.mockResolvedValue({ username: 'user1', activeCaseloadId: 'HEI' })

      const result = await userService.getActiveCaseLoadId(token)

      expect(result).toStrictEqual('HEI')
    })
  })

  describe('getUserCaseLoadIds', () => {
    const usersCaseLoads = TestData.caseLoads()

    it('should return an array of available caseload IDs for current user', async () => {
      prisonApiClient.getUserCaseLoads.mockResolvedValue(usersCaseLoads)

      const result = await userService.getUserCaseLoadIds('user')

      expect(result).toStrictEqual(['BLI', 'HEI'])
    })
  })

  describe('setActiveCaseLoad', () => {
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
