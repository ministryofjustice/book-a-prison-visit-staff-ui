import UserService from './userService'
import TestData from '../routes/testutils/testData'
import {
  createMockHmppsAuthClient,
  createMockNomisUserRolesApiClient,
  createMockPrisonApiClient,
} from '../data/testutils/mocks'
import createUserToken from '../testutils/createUserToken'

jest.mock('../data/manageUsersApiClient')

describe('User service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const nomisUserRolesApiClient = createMockNomisUserRolesApiClient()
  const prisonApiClient = createMockPrisonApiClient()
  let userService: UserService

  const PrisonApiClientFactory = jest.fn()

  describe('getActiveCaseLoadId', () => {
    beforeEach(() => {
      PrisonApiClientFactory.mockReturnValue(prisonApiClient)
      userService = new UserService(hmppsAuthClient, nomisUserRolesApiClient, PrisonApiClientFactory)
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
