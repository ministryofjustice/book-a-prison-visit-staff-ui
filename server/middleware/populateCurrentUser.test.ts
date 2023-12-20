import { Request, Response } from 'express'
import { createMockUserService } from '../services/testutils/mocks'
import populateCurrentUser from './populateCurrentUser'

const userService = createMockUserService()

let req: Request
let res: Response
const next = jest.fn()

describe('populateCurrentUser', () => {
  beforeEach(() => {
    req = {} as Request
    res = { locals: {} } as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user is not set in res.locals', () => {
    it('should call next() function if user not set', async () => {
      await populateCurrentUser(userService)(req, res, next)

      expect(userService.getUser).not.toHaveBeenCalled()
      expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when the user is set in res.locals', () => {
    beforeEach(() => {
      res.locals.user = {
        authSource: 'nomis',
        token: 'some token',
      }
    })

    it('should populate the current user if details returned from user service', async () => {
      userService.getUser.mockResolvedValue({ displayName: 'User One', username: 'user1', roles: [] })
      userService.getActiveCaseLoadId.mockResolvedValue('HEI')

      await populateCurrentUser(userService)(req, res, next)

      expect(res.locals.user).toStrictEqual(<Express.User>{
        authSource: 'nomis',
        displayName: 'User One',
        roles: [],
        token: 'some token',
        username: 'user1',
        activeCaseLoadId: 'HEI',
      })
      expect(userService.getUser).toHaveBeenCalled()
      expect(userService.getActiveCaseLoadId).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    // activeCaseLoadId is returned from Manage Users API /users/me but is undocumented/deprecated
    // if it is not available it is looked up from Nomis user roles API
    it('should populate the current user without looking up active caseload if it is already set', async () => {
      userService.getUser.mockResolvedValue({
        displayName: 'User One',
        username: 'user1',
        roles: [],
        activeCaseLoadId: 'HEI',
      })

      await populateCurrentUser(userService)(req, res, next)

      expect(res.locals.user).toStrictEqual(<Express.User>{
        authSource: 'nomis',
        displayName: 'User One',
        roles: [],
        token: 'some token',
        username: 'user1',
        activeCaseLoadId: 'HEI',
      })
      expect(userService.getUser).toHaveBeenCalled()
      expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should handle user details not being available from the user service', async () => {
      userService.getUser.mockResolvedValue(null)

      await populateCurrentUser(userService)(req, res, next)

      expect(res.locals.user).toStrictEqual(<Express.User>{
        authSource: 'nomis',
        token: 'some token',
      })
      expect(userService.getUser).toHaveBeenCalled()
      expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should propagate errors', async () => {
      const error = new Error('User service error')
      userService.getUser.mockRejectedValue(error)

      await populateCurrentUser(userService)(req, res, next)

      expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
