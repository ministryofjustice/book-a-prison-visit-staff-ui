import { Request, Response } from 'express'
import TestData from '../routes/testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'
import populateSelectedEstablishment from './populateSelectedEstablishment'

const supportedPrisonsService = createMockSupportedPrisonsService()

const supportedPrisons = TestData.supportedPrisons()

let req: Request
const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const next = jest.fn()

describe('populateSelectedEstablishment', () => {
  beforeEach(() => {
    req = { session: {} } as unknown as Request

    res.locals = {
      selectedEstablishment: undefined,
      user: <Express.User>{ activeCaseLoadId: 'HEI', username: 'user1' },
    }

    supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when establishment not already set in session', () => {
    it('should set establishment in session and populate res.locals if active caseload is a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      const prison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })
      supportedPrisonsService.getPrison.mockResolvedValue(prison)

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)
      await new Promise(process.nextTick)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith('user1', 'BLI')
      expect(req.session.selectedEstablishment).toStrictEqual(prison)
      expect(res.locals.selectedEstablishment).toStrictEqual(prison)
      expect(next).toHaveBeenCalled()
    })

    it('should redirect to /change-establishment if no establishment set and active caseload is not a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'XYZ'

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(res.redirect).toHaveBeenCalledWith('/change-establishment')
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(next).not.toHaveBeenCalled()
    })

    it('should redirect to /change-establishment if no establishment set and active caseload is not set', async () => {
      res.locals.user.activeCaseLoadId = undefined

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).toHaveBeenCalledWith('/change-establishment')
      expect(next).not.toHaveBeenCalled()
    })

    it('should make no changes and not redirect if request path is /change-establishment', async () => {
      ;(req.path as string) = '/change-establishment'

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(0)
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when establishment already set in session', () => {
    it('should populate res.locals with selected establishment without prisons lookup', async () => {
      req.session.selectedEstablishment = TestData.prison()

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })

    it('should populate res.locals with already selected establishment without prisons lookup if active caseload changes', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })

    it('should make no changes and not redirect if request path is /change-establishment', async () => {
      ;(req.path as string) = '/change-establishment'
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = TestData.prison()

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })
  })
})
