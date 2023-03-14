import UserService from './userService'
import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockPrisonApiClient } from '../data/testutils/mocks'
import type { User } from '../data/hmppsAuthClient'

const token = 'some token'

describe('User service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const prisonApiClient = createMockPrisonApiClient()
  let userService: UserService

  const PrisonApiClientFactory = jest.fn()

  describe('getUser', () => {
    beforeEach(() => {
      PrisonApiClientFactory.mockReturnValue(prisonApiClient)
      userService = new UserService(hmppsAuthClient, PrisonApiClientFactory)
      hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
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
